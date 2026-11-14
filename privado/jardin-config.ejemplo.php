<?php
/* ==========================================================================
   EJEMPLO de configuración privada del backend (formulario "Quiero enterarme
   primero" y listado /admin/interesados.php).

   El archivo real se llama jardin-config.php y vive en el servidor, en una
   carpeta `privado/` FUERA de public_html:
     /home/<usuario>/domains/eljardindelosgatosnegros.com.ar/privado/jardin-config.php
   Nunca se sube al repositorio (la carpeta privado/ está en .gitignore salvo
   este ejemplo).

   La contraseña del panel se guarda como hash. Para generar uno:
     php -r 'echo password_hash("la-contraseña", PASSWORD_DEFAULT), PHP_EOL;'
   ========================================================================== */
return [
  // MySQL (Hostinger: misma máquina que el sitio)
  'db_host' => '127.0.0.1',
  'db_puerto' => 3306,
  'db_nombre' => 'u770738641_jardin',
  'db_usuario' => 'u770738641_jardin',
  'db_clave' => 'CAMBIAR',

  // Texto al azar y largo: se mezcla con la IP antes de guardar su hash
  'sal' => 'CAMBIAR-por-un-texto-largo-al-azar',

  // Cuántos envíos acepta por hora desde una misma conexión
  'max_por_hora' => 5,

  // Aviso por mail de cada persona nueva
  'aviso_email' => 'eljardindelosgatosnegros@gmail.com',
  'mail_desde' => 'no-responder@eljardindelosgatosnegros.com.ar',
  'admin_url' => 'https://bios.eljardindelosgatosnegros.com.ar/admin/interesados.php',

  // Panel /admin/interesados.php
  'admin_usuario' => 'luz',
  'admin_clave_hash' => '$2y$10$CAMBIAR',
];
