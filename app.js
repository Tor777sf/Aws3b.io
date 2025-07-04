const awsconfig = {
  Auth: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_U6v05NV',
    userPoolWebClientId: '1eh7lv1aa15spci9v95qpg2s',
    identityPoolId: 'us-east-2:7cfbef35-86b2-449c-937d-1b3f68454',
    oauth: {
      domain: 'us-east-2u6vqt0nv.auth.us-east-2.amazoncognito.com',
      redirectSignIn: 'https://to77sf.github.io/AwsS3a/callback.html',
      redirectSignOut: 'https://to77sf.github.io/AwsS3a/index.html',
      responseType: 'code'
    }
  },
  Storage: {
    AWSS3: {
      bucket: 'archivos-seguros-usuarios',
      region: 'us-east-2'
    }
  }
};

window.Amplify.configure(awsconfig);
const { Auth, Storage } = window.Amplify;

Auth.currentAuthenticatedUser()
  .then(() => obtenerArchivos())
  .catch(() => console.log("No autenticado."));

function login() {
  Auth.federatedSignIn();
}

function logout() {
  Auth.signOut();
}

function subir() {
  const archivo = document.getElementById("fileInput").files[0];
  if (!archivo) return alert("Selecciona un archivo");
  Storage.put(archivo.name, archivo, {
    contentType: archivo.type,
    level: 'private'
  }).then(() => {
    alert("Archivo subido");
    obtenerArchivos();
  }).catch(err => console.error(err));
}

function obtenerArchivos() {
  Storage.list('', { level: 'private' })
    .then(archivos => {
      const lista = document.getElementById("fileList");
      lista.innerHTML = archivos.map(f => `<li>${f.key}</li>`).join('') || '<li>No hay archivos.</li>';
    })
    .catch(err => console.error("Error listando archivos:", err));
}

