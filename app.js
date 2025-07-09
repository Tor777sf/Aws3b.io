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
document.getElementById("userInfo").textContent = `Sesión: ${user.attributes?.email || user.username}`;

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await Auth.signOut();
  window.location.href = "/Aws3b.io/";
});

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
          .map(f => `
            <li>
              <strong style="cursor:pointer" onclick="abrirArchivo('${f.key}')">${f.key}</strong><br>
              <button onclick="descargarArchivo('${f.key}')">Descargar</button>
              <button onclick="renombrarArchivo('${f.key}')">Renombrar</button>
              <button onclick="compartirArchivo('${f.key}')">Compartir</button>
              <button onclick="eliminarArchivo('${f.key}')">Eliminar</button>
            </li>
          `)
          .join('');
  } catch (error) {
    console.error("Error al listar archivos:", error);
  }
}

  window.abrirArchivo = async function(nombreArchivo) {
  const url = await Storage.get(nombreArchivo, { level: 'private' });
  window.open(url, '_blank');
};

window.descargarArchivo = async function(nombreArchivo) {
  const url = await Storage.get(nombreArchivo, { level: 'private' });
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  link.click();
};

window.renombrarArchivo = async function(nombreOriginal) {
  const nuevoNombre = prompt("Nuevo nombre para el archivo:", nombreOriginal);
  if (!nuevoNombre || nuevoNombre === nombreOriginal) return;

  try {
    const archivo = await Storage.get(nombreOriginal, { download: true, level: 'private' });
    await Storage.put(nuevoNombre, archivo.Body, { level: 'private', contentType: archivo.ContentType });
    await Storage.remove(nombreOriginal, { level: 'private' });
    mostrarEstado("Éxito", `Archivo renombrado a ${nuevoNombre}`);
    obtenerArchivos();
  } catch (e) {
    console.error(e);
    mostrarEstado("Error", "No se pudo renombrar.");
  }
};

window.compartirArchivo = async function(nombreArchivo) {
  const url = await Storage.get(nombreArchivo, { level: 'private', expires: 3600 });
  prompt("Enlace válido por 1 hora:", url);
};

window.eliminarArchivo = async function(nombreArchivo) {
  if (!confirm(`¿Eliminar "${nombreArchivo}"?`)) return;
  await Storage.remove(nombreArchivo, { level: 'private' });
  mostrarEstado("Éxito", `"${nombreArchivo}" eliminado.`);
  obtenerArchivos();
};

  

  function mostrarEstado(titulo, mensaje) {
    const estado = document.getElementById("estado");
    if (estado) {
      estado.innerHTML = `<h2>${titulo}</h2><p>${mensaje}</p>`;
    }
  }
});


