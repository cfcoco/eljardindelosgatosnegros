<?php
/* ==========================================================================
   POST /api/mensaje.php · recibe el formulario de mensaje de Alianzas (dossier).
   Entrada (JSON): { nombre, contacto (mail o teléfono), mensaje, origen?,
                     web (trampa, tiene que venir vacío), t (ms desde que se abrió) }
   Salida: { ok: true } o { ok: false, error: 'codigo', campo?: '...' }
   Guarda en la tabla `mensajes` con sentencias preparadas, frena spam (campo
   trampa + límite por IP) y avisa por mail. Misma base y misma configuración
   privada que api/anotate.php.
   ========================================================================== */
declare(strict_types=1);
define('JARDIN', true);
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jardin_json(405, ['ok' => false, 'error' => 'metodo']);
jardin_exigir_mismo_origen();

$crudo = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode($crudo ?: '', true);
if (!is_array($d)) jardin_json(400, ['ok' => false, 'error' => 'formato']);

/* Campo trampa y tiempo mínimo: a los robots se les responde ok para no dar pistas. */
if (!empty($d['web'])) jardin_json(200, ['ok' => true]);
if (isset($d['t']) && is_numeric($d['t']) && (float)$d['t'] < 2000) jardin_json(200, ['ok' => true]);

$nombre = jardin_texto($d['nombre'] ?? '', 80);
$contacto = jardin_texto($d['contacto'] ?? '', 120);
$mensaje = is_string($d['mensaje'] ?? null) ? trim(mb_substr(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $d['mensaje']) ?? '', 0, 3000, 'UTF-8')) : '';
$origen = preg_replace('/[^a-z0-9_-]/', '', strtolower(jardin_texto($d['origen'] ?? 'dossier', 40))) ?: 'dossier';

if ($nombre === '') jardin_json(422, ['ok' => false, 'error' => 'nombre', 'campo' => 'nombre']);
if ($contacto === '') jardin_json(422, ['ok' => false, 'error' => 'contacto', 'campo' => 'contacto']);
if (filter_var($contacto, FILTER_VALIDATE_EMAIL)) {
  $contacto = strtolower($contacto);
} else {
  $digitos = preg_replace('/\D+/', '', $contacto) ?? '';
  $largo = strlen($digitos);
  if ($largo < 8 || $largo > 15) jardin_json(422, ['ok' => false, 'error' => 'contacto', 'campo' => 'contacto']);
}
if (mb_strlen($mensaje, 'UTF-8') < 5) jardin_json(422, ['ok' => false, 'error' => 'mensaje', 'campo' => 'mensaje']);

try {
  $pdo = jardin_pdo();
  jardin_preparar_tablas($pdo);
  $cfg = jardin_config();
  $ipHash = hash('sha256', jardin_ip() . '|' . ($cfg['sal'] ?? ''));

  $max = (int)($cfg['max_por_hora'] ?? 5);
  $q = $pdo->prepare('SELECT COUNT(*) FROM mensajes WHERE ip_hash = ? AND creado > (NOW() - INTERVAL 1 HOUR)');
  $q->execute([$ipHash]);
  if ((int)$q->fetchColumn() >= $max) jardin_json(429, ['ok' => false, 'error' => 'limite']);

  $fila = [
    'creado' => date('Y-m-d H:i:s'),
    'nombre' => $nombre,
    'contacto' => $contacto,
    'mensaje' => $mensaje,
    'origen' => $origen,
    'ip_hash' => $ipHash,
  ];
  $ins = $pdo->prepare('INSERT INTO mensajes (creado, nombre, contacto, mensaje, origen, ip_hash)
                        VALUES (:creado, :nombre, :contacto, :mensaje, :origen, :ip_hash)');
  $ins->execute($fila);

  jardin_avisar_mensaje($fila);
  jardin_json(200, ['ok' => true]);
} catch (Throwable $e) {
  error_log('mensaje.php: ' . $e->getMessage());
  jardin_json(500, ['ok' => false, 'error' => 'servidor']);
}
