<?php
/* ==========================================================================
   POST /api/anotate.php · recibe el formulario "Quiero enterarme primero".
   Entrada (JSON): { nombre, canal: 'whatsapp'|'mail', contacto, quiere_leer?,
                     bar_recomendado?, origen?, web (trampa, tiene que venir vacío), t (ms) }
   Salida: { ok: true } o { ok: false, error: 'codigo', campo?: '...' }
   Guarda en MySQL con sentencias preparadas, frena spam (campo trampa + límite
   por IP) y avisa por mail. Pensado para crecer: la misma base servirá para
   las inscripciones con cupos.
   ========================================================================== */
declare(strict_types=1);
define('JARDIN', true);
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jardin_json(405, ['ok' => false, 'error' => 'metodo']);

/* Solo desde el propio sitio (si el navegador manda Origin/Referer, tiene que coincidir). */
$host = strtolower($_SERVER['HTTP_HOST'] ?? '');
foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $h) {
  if (!empty($_SERVER[$h])) {
    $o = strtolower((string)parse_url($_SERVER[$h], PHP_URL_HOST));
    if ($o !== '' && $host !== '' && $o !== $host) jardin_json(403, ['ok' => false, 'error' => 'origen']);
  }
}

$crudo = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode($crudo ?: '', true);
if (!is_array($d)) jardin_json(400, ['ok' => false, 'error' => 'formato']);

/* Campo trampa: los robots lo completan, las personas no lo ven. Se responde ok para no dar pistas. */
if (!empty($d['web'])) jardin_json(200, ['ok' => true]);
/* Nadie contesta cuatro preguntas en menos de un segundo y medio. */
if (isset($d['t']) && is_numeric($d['t']) && (float)$d['t'] < 1500) jardin_json(200, ['ok' => true]);

$nombre = jardin_texto($d['nombre'] ?? '', 80);
$canal = ($d['canal'] ?? '') === 'mail' ? 'mail' : (($d['canal'] ?? '') === 'whatsapp' ? 'whatsapp' : '');
$contacto = jardin_texto($d['contacto'] ?? '', 120);
$leer = jardin_texto($d['quiere_leer'] ?? '', 1000);
$bar = jardin_texto($d['bar_recomendado'] ?? '', 160);
$origen = preg_replace('/[^a-z0-9_-]/', '', strtolower(jardin_texto($d['origen'] ?? 'bios', 40))) ?: 'bios';

if ($nombre === '') jardin_json(422, ['ok' => false, 'error' => 'nombre', 'campo' => 'nombre']);
if ($canal === '' || $contacto === '') jardin_json(422, ['ok' => false, 'error' => 'contacto', 'campo' => 'contacto']);
if ($canal === 'mail') {
  if (!filter_var($contacto, FILTER_VALIDATE_EMAIL)) jardin_json(422, ['ok' => false, 'error' => 'mail', 'campo' => 'contacto']);
  $contacto = strtolower($contacto);
} else {
  $digitos = preg_replace('/\D+/', '', $contacto) ?? '';
  $largo = strlen($digitos);
  if ($largo < 8 || $largo > 15) jardin_json(422, ['ok' => false, 'error' => 'whatsapp', 'campo' => 'contacto']);
  $contacto = $digitos;
}

try {
  $pdo = jardin_pdo();
  jardin_preparar_tablas($pdo);
  $cfg = jardin_config();
  $ipHash = hash('sha256', jardin_ip() . '|' . ($cfg['sal'] ?? ''));

  /* Límite por IP: como mucho N envíos por hora. */
  $max = (int)($cfg['max_por_hora'] ?? 5);
  $q = $pdo->prepare('SELECT COUNT(*) FROM interesados WHERE ip_hash = ? AND creado > (NOW() - INTERVAL 1 HOUR)');
  $q->execute([$ipHash]);
  if ((int)$q->fetchColumn() >= $max) jardin_json(429, ['ok' => false, 'error' => 'limite']);

  $fila = [
    'creado' => date('Y-m-d H:i:s'),
    'nombre' => $nombre,
    'canal' => $canal,
    'contacto' => $contacto,
    'quiere_leer' => $leer !== '' ? $leer : null,
    'bar_recomendado' => $bar !== '' ? $bar : null,
    'origen' => $origen,
    'ip_hash' => $ipHash,
  ];
  $ins = $pdo->prepare('INSERT INTO interesados (creado, nombre, canal, contacto, quiere_leer, bar_recomendado, origen, ip_hash)
                        VALUES (:creado, :nombre, :canal, :contacto, :quiere_leer, :bar_recomendado, :origen, :ip_hash)');
  $ins->execute($fila);

  jardin_avisar($fila);
  jardin_json(200, ['ok' => true]);
} catch (Throwable $e) {
  error_log('anotate.php: ' . $e->getMessage());
  jardin_json(500, ['ok' => false, 'error' => 'servidor']);
}
