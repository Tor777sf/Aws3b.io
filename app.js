document.addEventListener("DOMContentLoaded", () => {
  const Amplify = aws_amplify.Amplify;
  const Auth = aws_amplify.Auth;
  const Storage = aws_amplify.Storage;
  const Hub = aws_amplify.Hub;
  const awsconfig = {
    Auth: {
      region: 'us-east-2',
      userPoolId: 'us-east-2_U6vQT05NV',
      userPoolWebClientId: '61eh7lv1aa15spci69v95qpg2s',
      identityPoolId: 'us-east-2:7cfbef35-86b2-449c-937d-1b3f68442c54',
      oauth: {
        domain: 'us-east-2u6vqt05nv.auth.us-east-2.amazoncognito.com',
        scope: ['openid', 'email'],
        redirectSignIn: 'https://tor777sf.github.io/Aws3b.io/callback',
        redirectSignOut: 'https://tor777sf.github.io/Aws3b.io/',
        responseType: 'token'
      }
    },
    Storage: {
      AWSS3: {
        bucket: 'archivos-seguros-usuarios',
        region: 'us-east-2'
      }
    }
  };

  Amplify.configure(awsconfig);

  window.login = function () {
    Auth.federatedSignIn();
  };

  if (window.location.pathname.includes("callback")) {
  Hub.listen('auth', async ({ payload }) => {
    if (payload.event === 'signIn') {
      try {
        const user = await Auth.currentAuthenticatedUser();
        mostrarEstado("¡Autenticación exitosa!", "Ya puedes subir y ver tus archivos.");
        await crearCarpetaSiNoExiste();
        obtenerArchivos();
        document.getElementById("uploadBtn").addEventListener("click", subirArchivo);
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
        mostrarEstado("Error", "No se pudo obtener el usuario.");
      }
    } else if (payload.event === 'signIn_failure') {
      console.error("Fallo en inicio de sesión:", payload.data);
      mostrarEstado("Error", "Fallo en el inicio de sesión.");
    }
  });

  // Intenta detectar si ya está autenticado (por ejemplo, recargando callback)
  Auth.currentAuthenticatedUser()
    .then(async user => {
      mostrarEstado("¡Autenticación detectada!", "Ya puedes subir y ver tus archivos.");
      await crearCarpetaSiNoExiste();
      obtenerArchivos();
      document.getElementById("uploadBtn").addEventListener("click", subirArchivo);
    })
    .catch(() => {
      // Nada, esperamos a Hub.listen
    });
}

  async function crearCarpetaSiNoExiste() {
    try {
      const archivos = await Storage.list('', { level: 'private' });
      if (archivos.length === 0) {
        await Storage.put('.init', '', { level: 'private' });
        console.log("Carpeta inicial creada.");
      }
    } catch (error) {
      console.error("Error creando carpeta inicial:", error);
    }
  }

  async function subirArchivo() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return alert("Selecciona un archivo.");

    const progressBar = document.getElementById("progressBar");
    document.getElementById("progressContainer").style.display = 'block';
    progressBar.style.width = '0%';

    try {
      await Storage.put(file.name, file, {
        level: 'private',
        contentType: file.type,
        progressCallback(progress) {
          const percent = (progress.loaded / progress.total) * 100;
          progressBar.style.width = `${percent}%`;
        }
      });
      mostrarEstado("Éxito", "Archivo subido correctamente.");
      obtenerArchivos();
    } catch (error) {
      console.error("Error al subir archivo:", error);
      mostrarEstado("Error", "No se pudo subir el archivo.");
    } finally {
      document.getElementById("progressContainer").style.display = 'none';
    }
  }

  async function obtenerArchivos() {
    try {
      const archivos = await Storage.list('', { level: 'private' });
      const fileList = document.getElementById("fileList");
      fileList.innerHTML = archivos.length === 0
        ? '<li>Tu carpeta está vacía.</li>'
        : archivos
            .filter(f => f.key !== '.init')
            .map(f => `<li>${f.key}</li>`)
            .join('');
    } catch (error) {
      console.error("Error al listar archivos:", error);
    }
  }

  function mostrarEstado(titulo, mensaje) {
    const estado = document.getElementById("estado");
    if (estado) {
      estado.innerHTML = `<h2>${titulo}</h2><p>${mensaje}</p>`;
    }
  }
});
