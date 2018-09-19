function template(object){
  return `<!DOCTYPE html>
 <html>

  <head>

    <meta charset="utf-8" />
    <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width" />
    <meta name="HandheldFriendly" content="true">
    <meta name="MobileOptimized" content="width">

    <title> video_platform | Recuperar Contraseña </title>
    
    <!-- Estilos -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

    </style>

  </head>

  <body style="width: 100%; height: 100%; padding: 0px; margin: auto; background: #f4f4f4; font-family: sans-serif; box-sizing: border-box;">

  <table style="width:90%; max-width: 500px; background:#fff; padding: 0px; margin: 5px auto; border-top: 5px solid rgba(0,163,217,1); border-collapse: collapse; box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.25)">
    <!-- Header -->
    <tr style="width: 100%; background:rgba(0,163,217,0.1); ">
      <td style="width: 100%; padding: 0px 10px 35px; text-align: center; vertical-align: top; line-height: 40px;">
        Recuperar contraseña.
      </td>
    </tr>

    <tr style="width: 100%;">
      <td style="width: 100%; padding: 20px 10px;">
        <span style="width: 60px; height: 60px; display: block; position: absolute; left: 50%; margin-left: -30px; margin-top: -50px; background: #fff; box-shadow: 0px 1px 2px 0px #ccc; border-radius: 100%; padding: 5px; box-sizing: border-box;">
          <i class="material-icons" style="display: block; width: 100%; height: 60px; line-height: 50px; margin-left: -3px; font-size: 32px; text-align: center; color: rgba(0,0,0,0.25); ">phonelink_lock</i>
        </span>
      </td>
    </tr>

    <!-- Content -->
    <tr style="width: 100%;">
      <td style="width: 100%; padding: 0px 10px 15px;">
        <i style="display: block; text-align: center; font-style: normal; font-size: 12px; color: #999;">Has solicitado restablecer tu contraseña.</i>
        <i style="display: block; text-align: center; font-style: normal; font-size: 12px; color: #999;">El enlace caducará una hora después de haber recibido este email.</i>
         <!-- This button must contain the link to update the user password, giving a temporary token that expires in 1 hour -->
        
        <a href="${object.link_callback}">
        <b style="display: block; width: 200px; padding: 5px; margin: 5px auto; text-align: center; font-style: normal; font-size: 16px; color: #fff; background:rgba(0,163,217,1); cursor: pointer">Restablecer contraseña</b>
        </a>
        <i style="display: block; text-align: center; font-style: normal; font-size: 12px; color: #999;">Si tu no solicitaste el restablecimiento de contraseña, por favor haz caso omiso a este mensaje.</i>
      </td>
    </tr>

    <tr style="width: 100%;">
      <td style="width: 100%; padding: 20px 10px;">
        <span style="width: 80px; height: 80px; display: block; position: absolute; left: 50%; margin-left: -40px; margin-top: -25px; background: #fff; box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.25); border-radius: 100%; padding: 5px; box-sizing: border-box;">
          <img src="http://video_platform.mx/img/logo-mini.png" style="width: 60px; display: block; object-fit: contain; margin: 5px auto;" />
        </span>
      </td>
    </tr>

    <!-- Footer -->
    <tr style="width: 100%;">
      <tr style="width: 100%; background:rgba(0,163,217,0.1); ">
      <td colspan="2" style="width: 100%; padding: 40px 10px 15px; text-align: center; vertical-align: top;">
        <i style="display: block; text-align: center; font-style: normal; font-size: 12px; color: #999;">Si necesitas ayuda extra o más información, por favor ponte en contacto con nosotros <a href="mailto:soporte@video_platform.mx" style="color:rgba(0,163,217,1); text-decoration: none;">Soporte técnico</a> o bien en <a href="mailto:clientes@video_platform.mx" style="color:rgba(0,163,217,1); text-decoration: none;">Atención al cliente</a>.</i>
        <i style="display: block; text-align: center; font-style: normal; font-size: 10px; color: #aaa; margin-top: 10px;">video_platform SA de CV <br> © Todos los derechos reservados.</i>
      </td>
    </tr>
  </table>

  </body>
</html>`;
  
}



module.exports = template