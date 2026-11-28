<?php
/* ==========================================================================
   /admin/interesados.php · listado para Luz de las personas anotadas.
   Pide usuario y contraseña (están en privado/jardin-config.php, fuera de
   public_html). Muestra la tabla y la deja bajar en CSV (?csv=1) para abrir
   en Excel o Google Sheets. Sin JavaScript: funciona en cualquier celular.
   ========================================================================== */
declare(strict_types=1);
define('JARDIN', true);
require dirname(__DIR__) . '/api/lib.php';

$cfg = jardin_config();
$usuario = (string)($cfg['admin_usuario'] ?? '');
$hash = (string)($cfg['admin_clave_hash'] ?? '');

session_name('jardin_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Lax']);
session_start();

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$h = fn(mixed $s): string => htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

/* ---------- salir ---------- */
if (isset($_GET['salir'])) {
  $_SESSION = [];
  session_destroy();
  header('Location: interesados.php');
  exit;
}

/* ---------- entrar ---------- */
$error = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['usuario'], $_POST['clave'])) {
  $intentos = (int)($_SESSION['intentos'] ?? 0);
  if ($intentos >= 8) { sleep(3); }
  $u = (string)$_POST['usuario'];
  $okUsuario = $usuario !== '' && hash_equals($usuario, $u);
  $okClave = $hash !== '' && password_verify((string)$_POST['clave'], $hash);
  if ($okUsuario && $okClave) {
    session_regenerate_id(true);
    $_SESSION['entro'] = true;
    $_SESSION['intentos'] = 0;
    header('Location: interesados.php');
    exit;
  }
  $_SESSION['intentos'] = $intentos + 1;
  sleep(1);
  $error = 'Usuario o contraseña incorrectos.';
}

$entro = !empty($_SESSION['entro']);

/* ---------- datos ---------- */
$filas = [];
$mensajes = [];
$aviso = '';
if ($entro) {
  try {
    $pdo = jardin_pdo();
    jardin_preparar_tablas($pdo);
    $filas = $pdo->query('SELECT id, creado, nombre, canal, contacto, quiere_leer, bar_recomendado, origen FROM interesados ORDER BY creado DESC, id DESC')->fetchAll();
    $mensajes = $pdo->query('SELECT id, creado, nombre, contacto, mensaje, origen FROM mensajes ORDER BY creado DESC, id DESC')->fetchAll();
  } catch (Throwable $e) {
    error_log('interesados.php: ' . $e->getMessage());
    $aviso = 'No se pudo leer la base de datos. Probá de nuevo en un momento.';
  }

  /* CSV para Excel / Google Sheets (con BOM y punto y coma, como espera Excel en español).
     ?csv=1 baja las personas anotadas; ?csv=mensajes, los mensajes de Alianzas. */
  if (isset($_GET['csv']) && $aviso === '') {
    $esMensajes = $_GET['csv'] === 'mensajes';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . ($esMensajes ? 'mensajes' : 'interesados') . '-' . date('Y-m-d') . '.csv"');
    $salida = fopen('php://output', 'w');
    fwrite($salida, "\xEF\xBB\xBF");
    if ($esMensajes) {
      fputcsv($salida, ['Fecha', 'Nombre', 'Contacto', 'Mensaje', 'Desde'], ';');
      foreach ($mensajes as $m) fputcsv($salida, [$m['creado'], $m['nombre'], $m['contacto'], $m['mensaje'], $m['origen']], ';');
    } else {
      fputcsv($salida, ['Fecha', 'Nombre', 'Avisar por', 'Contacto', 'Qué quiere leer', 'Bar recomendado', 'Desde'], ';');
      foreach ($filas as $f) {
        fputcsv($salida, [$f['creado'], $f['nombre'], $f['canal'] === 'whatsapp' ? 'WhatsApp' : 'Mail', $f['contacto'], $f['quiere_leer'] ?? '', $f['bar_recomendado'] ?? '', $f['origen']], ';');
      }
    }
    fclose($salida);
    exit;
  }
}
/* Mail o teléfono, según lo que haya escrito la persona. */
$contactoLibreHtml = function (string $c) use ($h): string {
  if (filter_var($c, FILTER_VALIDATE_EMAIL)) return '<a href="mailto:' . $h($c) . '">' . $h($c) . '</a>';
  $n = preg_replace('/\D+/', '', $c) ?? '';
  $wa = (strlen($n) === 10 ? '549' . $n : $n);
  return $n ? '<a href="https://wa.me/' . $h($wa) . '" target="_blank" rel="noopener">' . $h($c) . '</a>' : $h($c);
};

$fecha = function (string $s): string {
  $t = strtotime($s);
  return $t ? date('d/m/Y H:i', $t) : $s;
};
$contactoHtml = function (array $f) use ($h): string {
  if ($f['canal'] === 'whatsapp') {
    $n = preg_replace('/\D+/', '', $f['contacto']) ?? '';
    $wa = (strlen($n) === 10 ? '549' . $n : $n);
    return '<a href="https://wa.me/' . $h($wa) . '" target="_blank" rel="noopener">' . $h($f['contacto']) . '</a>';
  }
  return '<a href="mailto:' . $h($f['contacto']) . '">' . $h($f['contacto']) . '</a>';
};
?>
<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Interesados · El Jardín de los Gatos Negros</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{--crema:#F1F0EB;--negro:#010101;--bordo:#70293C;--rosa:#BE9BA5;--verde:#016D71}
*{box-sizing:border-box}
body{margin:0;background:var(--crema);color:var(--negro);font:400 16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
header{background:var(--bordo);color:var(--crema);padding:22px 18px}
header h1{margin:0;font-size:20px;font-weight:800}
header p{margin:4px 0 0;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--rosa)}
main{max-width:1100px;margin:0 auto;padding:20px 14px 60px}
.barra{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px}
.barra .total{font-weight:500}
.btn{display:inline-block;padding:11px 18px;border-radius:999px;background:var(--bordo);color:var(--crema);text-decoration:none;font-weight:500;font-size:14px;letter-spacing:.06em;border:0;cursor:pointer}
.btn.suave{background:transparent;color:var(--bordo);border:1px solid var(--bordo)}
.tabla{width:100%;overflow:auto;background:#fff;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
table{border-collapse:collapse;width:100%;min-width:720px}
th,td{padding:10px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #e6e2dc;font-size:14px}
th{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--bordo);background:#f7f5f1;position:sticky;top:0}
td a{color:var(--verde)}
.vacio{padding:40px;text-align:center;color:#6b6460}
.login{max-width:380px;margin:40px auto;background:#fff;padding:28px 22px;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.login h2{margin:0 0 14px;font-size:18px}
label{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--bordo);margin:14px 0 6px}
input{width:100%;padding:13px 14px;border:1px solid #cfc8c0;border-radius:12px;font-size:16px;background:#fff}
input:focus{outline:2px solid var(--verde);border-color:var(--verde)}
.error{color:#953651;margin-top:12px;font-size:14px}
.login .btn{width:100%;margin-top:20px;padding:14px}
.aviso{background:#fff3f5;color:#953651;padding:12px 14px;border-radius:12px;margin-bottom:14px}
</style>
</head>
<body>
<header><h1>Personas interesadas</h1><p>El Jardín de los Gatos Negros</p></header>
<main>
<?php if (!$entro): ?>
  <form class="login" method="post" action="interesados.php" autocomplete="off">
    <h2>Entrar</h2>
    <label for="u">Usuario</label><input id="u" name="usuario" required autocapitalize="off" autocomplete="username">
    <label for="c">Contraseña</label><input id="c" name="clave" type="password" required autocomplete="current-password">
    <?php if ($error): ?><p class="error"><?= $h($error) ?></p><?php endif; ?>
    <button class="btn" type="submit">Entrar</button>
  </form>
<?php else: ?>
  <div class="barra">
    <span class="total"><?= count($filas) ?> <?= count($filas) === 1 ? 'persona anotada' : 'personas anotadas' ?></span>
    <span>
      <a class="btn" href="interesados.php?csv=1">Descargar CSV</a>
      <a class="btn suave" href="interesados.php?salir=1">Salir</a>
    </span>
  </div>
  <?php if ($aviso): ?><p class="aviso"><?= $h($aviso) ?></p><?php endif; ?>
  <div class="tabla">
  <?php if (!$filas): ?>
    <p class="vacio">Todavía no se anotó nadie.</p>
  <?php else: ?>
    <table>
      <thead><tr><th>Fecha</th><th>Nombre</th><th>Avisar por</th><th>Contacto</th><th>Qué quiere leer</th><th>Bar recomendado</th><th>Desde</th></tr></thead>
      <tbody>
      <?php foreach ($filas as $f): ?>
        <tr>
          <td><?= $h($fecha($f['creado'])) ?></td>
          <td><?= $h($f['nombre']) ?></td>
          <td><?= $f['canal'] === 'whatsapp' ? 'WhatsApp' : 'Mail' ?></td>
          <td><?= $contactoHtml($f) ?></td>
          <td><?= $h($f['quiere_leer'] ?? '') ?></td>
          <td><?= $h($f['bar_recomendado'] ?? '') ?></td>
          <td><?= $h($f['origen']) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
  </div>

  <div class="barra" style="margin-top:34px">
    <span class="total"><?= count($mensajes) ?> <?= count($mensajes) === 1 ? 'mensaje desde el dossier' : 'mensajes desde el dossier' ?></span>
    <span><a class="btn" href="interesados.php?csv=mensajes">Descargar CSV</a></span>
  </div>
  <div class="tabla">
  <?php if (!$mensajes): ?>
    <p class="vacio">Todavía no llegó ningún mensaje.</p>
  <?php else: ?>
    <table>
      <thead><tr><th>Fecha</th><th>Nombre</th><th>Contacto</th><th>Mensaje</th><th>Desde</th></tr></thead>
      <tbody>
      <?php foreach ($mensajes as $m): ?>
        <tr>
          <td><?= $h($fecha($m['creado'])) ?></td>
          <td><?= $h($m['nombre']) ?></td>
          <td><?= $contactoLibreHtml($m['contacto']) ?></td>
          <td style="white-space:pre-wrap;max-width:460px"><?= $h($m['mensaje']) ?></td>
          <td><?= $h($m['origen']) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
  </div>
<?php endif; ?>
</main>
</body>
</html>
