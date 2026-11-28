<?php
/* ==========================================================================
   Funciones compartidas del backend (Hostinger, PHP 8.3 + MySQL).
   Las usan api/anotate.php y admin/interesados.php. No se llama directo.
   Credenciales: privado/jardin-config.php, FUERA de public_html (ver
   privado/jardin-config.ejemplo.php en el repositorio).
   ========================================================================== */
declare(strict_types=1);

if (!defined('JARDIN')) { http_response_code(404); exit; }

date_default_timezone_set('America/Argentina/Cordoba');

/** Lee la configuración privada. Busca privado/jardin-config.php en las carpetas de arriba de public_html. */
function jardin_config(): array {
  static $cfg = null;
  if ($cfg !== null) return $cfg;
  $candidatos = [];
  if (!empty($_SERVER['JARDIN_CONFIG'])) $candidatos[] = $_SERVER['JARDIN_CONFIG'];
  // Este archivo vive en public_html/bios/api/ (o public_html/api/): se sube hasta encontrar privado/.
  for ($n = 2; $n <= 5; $n++) $candidatos[] = dirname(__DIR__, $n) . '/privado/jardin-config.php';
  $raiz = $_SERVER['DOCUMENT_ROOT'] ?? '';
  if ($raiz) { $candidatos[] = dirname($raiz) . '/privado/jardin-config.php'; $candidatos[] = dirname($raiz, 2) . '/privado/jardin-config.php'; }
  $home = $_SERVER['HOME'] ?? getenv('HOME') ?: '';
  if ($home) $candidatos[] = rtrim($home, '/') . '/privado/jardin-config.php';
  foreach (array_unique($candidatos) as $c) {
    if (is_file($c)) { $leido = require $c; if (is_array($leido)) { $cfg = $leido; return $cfg; } }
  }
  throw new RuntimeException('Falta privado/jardin-config.php fuera de public_html');
}

/** Conexión a MySQL (en Hostinger: 127.0.0.1:3306, misma máquina que el sitio). */
function jardin_pdo(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $c = jardin_config();
  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'] ?? '127.0.0.1', (int)($c['db_puerto'] ?? 3306), $c['db_nombre']);
  $pdo = new PDO($dsn, $c['db_usuario'], $c['db_clave'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  return $pdo;
}

/** Crea las tablas si no existen todavía (se llama una vez por pedido, es barato). */
function jardin_preparar_tablas(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS interesados (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    creado DATETIME NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    canal ENUM('whatsapp','mail') NOT NULL,
    contacto VARCHAR(120) NOT NULL,
    quiere_leer TEXT NULL,
    bar_recomendado VARCHAR(160) NULL,
    origen VARCHAR(40) NOT NULL DEFAULT 'bios',
    ip_hash CHAR(64) NOT NULL,
    PRIMARY KEY (id),
    KEY ip_creado (ip_hash, creado),
    KEY creado (creado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
  /* Mensajes del formulario de Alianzas (dossier): nombre, mail o teléfono y texto libre. */
  $pdo->exec("CREATE TABLE IF NOT EXISTS mensajes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    creado DATETIME NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    contacto VARCHAR(120) NOT NULL,
    mensaje TEXT NOT NULL,
    origen VARCHAR(40) NOT NULL DEFAULT 'dossier',
    ip_hash CHAR(64) NOT NULL,
    PRIMARY KEY (id),
    KEY ip_creado (ip_hash, creado),
    KEY creado (creado)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

/** Solo acepta pedidos del propio sitio: si el navegador manda Origin/Referer, el host tiene que coincidir. */
function jardin_exigir_mismo_origen(): void {
  $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
  foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $h) {
    if (!empty($_SERVER[$h])) {
      $o = strtolower((string)parse_url($_SERVER[$h], PHP_URL_HOST));
      if ($o !== '' && $host !== '' && $o !== $host) jardin_json(403, ['ok' => false, 'error' => 'origen']);
    }
  }
}

/** Manda por mail un mensaje recibido desde el formulario de Alianzas. Si falla, no corta el pedido. */
function jardin_avisar_mensaje(array $m): bool {
  $c = jardin_config();
  $para = $c['aviso_email'] ?? '';
  if (!$para) return false;
  $de = $c['mail_desde'] ?? ('no-responder@' . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
  $asunto = 'Nuevo mensaje desde el dossier: ' . $m['nombre'];
  $lineas = [
    'Alguien escribió desde el formulario de Alianzas del dossier.',
    '',
    'Nombre:   ' . $m['nombre'],
    'Contacto: ' . $m['contacto'],
    'Fecha:    ' . $m['creado'],
    '',
    'Mensaje:',
    $m['mensaje'],
    '',
    'Listado completo: ' . ($c['admin_url'] ?? ''),
  ];
  $cab = [
    'From: El Jardín de los Gatos Negros <' . $de . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: jardin-mensaje',
  ];
  if (filter_var($m['contacto'], FILTER_VALIDATE_EMAIL)) $cab[] = 'Reply-To: ' . $m['contacto'];
  $asuntoCod = '=?UTF-8?B?' . base64_encode($asunto) . '?=';
  return @mail($para, $asuntoCod, implode("\r\n", $lineas), implode("\r\n", $cab), '-f' . $de);
}

/** Responde JSON y termina. */
function jardin_json(int $codigo, array $datos): never {
  http_response_code($codigo);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

/** IP de quien pide (Hostinger no pone proxy delante, alcanza con REMOTE_ADDR). */
function jardin_ip(): string {
  return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/** Limpia un texto: sin caracteres de control, espacios normalizados, largo máximo. */
function jardin_texto(mixed $v, int $max): string {
  if (!is_string($v)) return '';
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
  $v = preg_replace('/[ \t]+/u', ' ', trim($v)) ?? '';
  return mb_substr($v, 0, $max, 'UTF-8');
}

/** Manda el aviso por mail con los datos de la persona nueva. Si falla, no corta el pedido. */
function jardin_avisar(array $p): bool {
  $c = jardin_config();
  $para = $c['aviso_email'] ?? '';
  if (!$para) return false;
  $de = $c['mail_desde'] ?? ('no-responder@' . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
  $asunto = 'Nueva persona interesada: ' . $p['nombre'];
  $lineas = [
    'Alguien se anotó para enterarse primero del próximo encuentro.',
    '',
    'Nombre:    ' . $p['nombre'],
    'Avisar por: ' . ($p['canal'] === 'whatsapp' ? 'WhatsApp' : 'Mail'),
    'Contacto:  ' . $p['contacto'],
    'Quiere leer: ' . ($p['quiere_leer'] ?? '—'),
    'Bar recomendado: ' . ($p['bar_recomendado'] ?? '—'),
    'Desde:     ' . $p['origen'],
    'Fecha:     ' . $p['creado'],
    '',
    'Listado completo: ' . ($c['admin_url'] ?? ''),
  ];
  $cab = [
    'From: El Jardín de los Gatos Negros <' . $de . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: jardin-anotate',
  ];
  if ($p['canal'] === 'mail') $cab[] = 'Reply-To: ' . $p['contacto'];
  $asuntoCod = '=?UTF-8?B?' . base64_encode($asunto) . '?=';
  return @mail($para, $asuntoCod, implode("\r\n", $lineas), implode("\r\n", $cab), '-f' . $de);
}
