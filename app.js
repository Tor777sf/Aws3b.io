document.addEventListener("DOMContentLoaded", () => {
  let listadoCompleto = []; // Guardará todos los archivos y carpetas

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
  
  let currentPath = ""; // Carpeta actual, raíz por defecto

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
        //await Storage.put("nombreCar", "test", { level: "private" });

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
      //await Storage.put(file.name, file, {
      await Storage.put(currentPath + file.name, file, {
        
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
    
    const archivos = await Storage.list(currentPath, { level: 'private' });
   listadoCompleto = archivos;
    const fileList = document.getElementById("fileList");
    const carpetas = archivos.filter(f => f.key.endsWith('/'));

    //const carpetas = archivos.filter(f => f.key.endsWith('/') && f.size === 0);
  //  const archivosSueltos = archivos.filter(f => !f.key.endsWith('/') && f.key !== '.init');
const archivosSueltos = archivos.filter(f =>
  !f.key.endsWith('/') &&
  f.key !== '.init' &&
  !f.key.endsWith('/.init.txt')
);

    fileList.innerHTML = `
      ${currentPath ? '<li><button onclick="irAtras()">🔙 Atrás</button></li>' : ''}
      ${carpetas.map(c => `
        <li><strong style="cursor:pointer" onclick="entrarCarpeta('${c.key}')">📁 ${c.key.replace(currentPath, '').replace('/', '')}</strong></li>
      `).join('')}
      ${archivosSueltos.map(f => `
        <li>
          <strong style="cursor:pointer" onclick="abrirArchivo('${f.key}')">📄 ${f.key.replace(currentPath, '')}</strong><br>
          <button onclick="descargarArchivo('${f.key}')">Descargar</button>
          <button onclick="renombrarArchivo('${f.key}')">Renombrar</button>
          <button onclick="compartirArchivo('${f.key}')">Compartir</button>
          <button onclick="eliminarArchivo('${f.key}')">Eliminar</button>
        </li>
      `).join('')}
    `;
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
  try {
    const url = await Storage.get(nombreArchivo, {
      level: 'private',
      expires: 3600 // 1 hora
    });

    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      // 📱 Móvil con soporte para navigator.share
      await navigator.share({
        title: "Archivo compartido",
        text: "Te comparto este archivo:",
        url: url
      });
      mostrarEstado("Compartido", "El enlace fue enviado correctamente.");
    } else {
      // 🖥️ Escritorio u otro navegador sin share nativo
      await navigator.clipboard.writeText(url);
      mostrarEstado("Enlace copiado", "Tu navegador no soporta compartir directo, pero el enlace fue copiado.");
    }

  } catch (error) {
    console.error("Error al compartir archivo:", error);
    mostrarEstado("Error", "No se pudo generar o compartir el enlace.");
  }
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
  
  window.entrarCarpeta = function(nombreCarpeta) {
  currentPath = nombreCarpeta;
  obtenerArchivos();
};

window.irAtras = function() {
  if (!currentPath) return;
  const partes = currentPath.split('/').filter(p => p);
  partes.pop();
  currentPath = partes.length ? partes.join('/') + '/' : '';
  obtenerArchivos();
};

  
window.crearCarpeta = async function() {
  const nombre = document.getElementById("newFolderName").value.trim();
  if (!nombre) return;

  try {
    const carpetaPath = `${currentPath}${nombre}/`;
    console.log("Ruta real de carpeta:", carpetaPath);

    await Storage.put(carpetaPath, 'temp', {
      level: 'private',
      contentType: 'text/plain'
    });

    mostrarEstado("Éxito", "Carpeta creada correctamente.");
    obtenerArchivos();
  } catch (e) {
    console.error("Error exacto al crear carpeta:", e.message || e);
    mostrarEstado("Error", "No se pudo crear la carpeta.");
  }
}

window.filtrarListado = async function () {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const fileList = document.getElementById("fileList");

  const carpetas = listadoCompleto.filter(f => f.key.endsWith('/'));
  const archivosSueltos = listadoCompleto.filter(f =>
    !f.key.endsWith('/') &&
    f.key !== '.init' &&
    !f.key.endsWith('/.init.txt')
  );

  const carpetasFiltradas = carpetas.filter(c => c.key.toLowerCase().includes(texto));
  const archivosFiltrados = archivosSueltos.filter(a => a.key.toLowerCase().includes(texto));

  // 🔹 1. Construimos el HTML
  fileList.innerHTML = `
    ${currentPath ? '<li><button onclick="irAtras()">🔙 Atrás</button></li>' : ''}
    ${carpetasFiltradas.map(c => `
      <li><strong style="cursor:pointer" onclick="entrarCarpeta('${c.key}')">📁 ${c.key.replace(currentPath, '').replace('/', '')}</strong></li>
    `).join('')}
    ${archivosFiltrados.map(f => {
      const nombre = f.key.replace(currentPath, '');
      const idPreview = "prev-" + f.key.replace(/[^a-zA-Z0-9]/g, '');
      return `
        <li>
          <div class="preview" id="${idPreview}">Cargando vista previa...</div>
          <strong style="cursor:pointer" onclick="abrirArchivo('${f.key}')">📄 ${nombre}</strong><br>
          <button onclick="descargarArchivo('${f.key}')">Descargar</button>
          <button onclick="renombrarArchivo('${f.key}')">Renombrar</button>
          <button onclick="compartirArchivo('${f.key}')">Compartir</button>
          <button onclick="eliminarArchivo('${f.key}')">Eliminar</button>
        </li>
      `;
    }).join('')}
  `;

  // 🔹 2. Cargamos vistas previas después de insertar el HTML
  for (const f of archivosFiltrados) {
    const tipo = obtenerTipoArchivo(f.key);
    const id = "prev-" + f.key.replace(/[^a-zA-Z0-9]/g, '');
    const contenedor = document.getElementById(id);

    try {
      const url = await Storage.get(f.key, { level: 'private' });

      if (tipo === 'imagen') {
        contenedor.innerHTML = `<img src="${url}" style="max-width: 100px; max-height: 100px; border-radius: 6px;" />`;
      } else if (tipo === 'video') {
        contenedor.innerHTML = `
          <video src="${url}" width="120" height="80" muted playsinline preload="metadata" style="border-radius: 6px;"></video>
        `;
      } else {
        contenedor.innerHTML = `<span style="font-size: 2rem;">📄</span>`;
      }
    } catch (e) {
      contenedor.innerHTML = '🧩';
    }
  }
};


function obtenerTipoArchivo(nombre) {
  const ext = nombre.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'imagen';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  return 'otro';
}


  
});


