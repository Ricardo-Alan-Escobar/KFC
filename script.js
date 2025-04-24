// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDIfbBk82U2M20N34mFFa011JZfM5hsaiU",
    authDomain: "dbkfc-4283f.firebaseapp.com",
    projectId: "dbkfc-4283f",
    storageBucket: "dbkfc-4283f.firebasestorage.app",
    messagingSenderId: "895822596286",
    appId: "1:895822596286:web:f4981c730202900eb036ef",
    measurementId: "G-WVLKYKWQF3"
  };
      
      // Inicializar Firebase
      firebase.initializeApp(firebaseConfig);
      const db = firebase.firestore();
      const valesRef = db.collection('vales');
      
      let qrScanner = null;
      let datos = [];
      
      // Mostrar indicador de carga mientras se conecta a Firebase
      function mostrarCargando() {
        Swal.fire({
          title: 'Conectando con la base de datos',
          html: 'Por favor espere...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
      }
      
      // Cargar datos desde Firebase al iniciar la página
      function cargarDatos() {
        document.getElementById('loading-indicator').style.display = 'block';
        mostrarCargando();
        
        valesRef.get().then((querySnapshot) => {
          // Si no hay documentos, crea los valores iniciales
          if (querySnapshot.empty) {
            crearValesIniciales();
          } else {
            datos = [];
            querySnapshot.forEach((doc) => {
              datos.push({...doc.data(), id: doc.id});
            });
            actualizarTabla();
            Swal.close();
          }
          document.getElementById('loading-indicator').style.display = 'none';
        }).catch((error) => {
          console.error("Error al cargar datos:", error);
          document.getElementById('loading-indicator').style.display = 'none';
          Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudieron cargar los datos desde Firebase. Verifica tu conexión a internet.',
            confirmButtonColor: '#e4002b'
          });
        });
      }
  
      // Crear vales iniciales si no existen en Firebase
      function crearValesIniciales() {
        const valesIniciales = [
          { id: 'v0001', nombre: 'v0001', edad: 500, qr: '', estado: 'Sin QR', fechaCanjeo: null },
          { id: 'v0002', nombre: 'v0002', edad: 500, qr: '', estado: 'Sin QR', fechaCanjeo: null },
          { id: 'v0003', nombre: 'v0003', edad: 500, qr: '', estado: 'Sin QR', fechaCanjeo: null },
          { id: 'v0004', nombre: 'v0004', edad: 500, qr: '', estado: 'Sin QR', fechaCanjeo: null },
          { id: 'v0005', nombre: 'v0004', edad: 500, qr: '', estado: 'Sin QR', fechaCanjeo: null },
          { id: 'v0006', nombre: 'v0005', edad: 500, qr: '', estado: 'Sin QR', fechaCanjeo: null }
        ];
        
        const batch = db.batch();
        
        valesIniciales.forEach(vale => {
          const docRef = valesRef.doc(vale.id);
          batch.set(docRef, vale);
        });
        
        batch.commit().then(() => {
          datos = valesIniciales;
          actualizarTabla();
          console.log("Vales iniciales creados en Firebase");
          Swal.fire({
            icon: 'success',
            title: 'Datos inicializados',
            text: 'Se han creado los vales iniciales en la base de datos.',
            confirmButtonColor: '#e4002b'
          });
        }).catch((error) => {
          console.error("Error al crear vales iniciales:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron crear los vales iniciales en Firebase.',
            confirmButtonColor: '#e4002b'
          });
        });
      }
  
      function formatearFechaHora(fecha) {
        if (!fecha) return '-';
        
        const opciones = { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        };
        
        return new Date(fecha).toLocaleString('es-ES', opciones);
      }
     
  
      let paginaActual = 1;
  const filasPorPagina = 5;
  
  function actualizarTabla(pagina = 1) {
    paginaActual = pagina;
  
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = '';
  
    // ✅ Asegúrate de contar todos los datos, no solo los de esta página
    const activos = datos.filter(d => d.estado === 'Activado').length;
    const canjeados = datos.filter(d => d.estado === 'Canjeado').length;
  
    // 🔢 Paginación
    const inicio = (pagina - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const datosPagina = datos.slice(inicio, fin);
  
    datosPagina.forEach((d) => {
      const botonDeshabilitado = d.qr ? 'disabled' : '';
      const textoBoton = d.qr ? 'Vale Asignado' : 'Asignar QR';
  
      let statusClass = 'status-inactive';
      if (d.estado === 'Activado') statusClass = 'status-active';
      else if (d.estado === 'Canjeado') statusClass = 'status-deactivated';
  
      tbody.innerHTML += `<tr>
        <td>${d.nombre}</td>
        <td>$${d.edad}</td>
        <td>${d.qr || '-'}</td>
        <td><span class="status ${statusClass}">${d.estado}</span></td>
        <td>${formatearFechaHora(d.fechaCanjeo)}</td>
        <td>
          <button onclick="startScan('${d.id}')" ${botonDeshabilitado} class="btn btn-primary">${textoBoton}</button>
        </td>
      </tr>`;
    });
  
    document.getElementById("contador-activos").textContent = `Activos: ${activos}`;
    document.getElementById("contador-canjeados").textContent = `Canjeados: ${canjeados}`;
  
    crearPaginacion();
  }
  
  
  function crearPaginacion() {
    const totalPaginas = Math.ceil(datos.length / filasPorPagina);
    const paginacionDiv = document.getElementById('paginacion');
    paginacionDiv.innerHTML = '';
  
    for (let i = 1; i <= totalPaginas; i++) {
      const boton = document.createElement('button');
      boton.textContent = i;
      boton.className = i === paginaActual ? 'pagina-activa' : '';
      boton.onclick = () => {
        actualizarTabla(i); // 👈 envía la página correcta
      };
      paginacionDiv.appendChild(boton);
    }
  }
  
  
      // Actualizar un vale en Firebase
      function actualizarVale(id, datosActualizados) {
        Swal.fire({
          title: 'Actualizando datos',
          html: 'Por favor espere...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        return valesRef.doc(id).update(datosActualizados)
          .then(() => {
            console.log(`Vale ${id} actualizado correctamente`);
            // Actualizar también en el array local
            const index = datos.findIndex(d => d.id === id);
            if (index !== -1) {
              datos[index] = {...datos[index], ...datosActualizados};
            }
            Swal.close();
          })
          .catch((error) => {
            console.error("Error al actualizar vale:", error);
            Swal.fire({
              icon: 'error',
              title: 'Error al actualizar',
              text: 'No se pudo actualizar el vale en la base de datos.',
              confirmButtonColor: '#e4002b'
            });
            throw error;
          });
      }
  
      function stopScan() {
        if (qrScanner) {
          qrScanner.stop().then(() => {
            console.log('Escaneo QR detenido');
          }).catch(err => {
            console.error('Error al detener el escaneo:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al detener el escáner QR.',
              confirmButtonColor: '#e4002b'
            });
          });
          qrScanner = null;
        }
        document.getElementById('reader-container').style.display = 'none';
      }
  
      document.getElementById('cancel-scan').addEventListener('click', function() {
        stopScan();
        Swal.fire({
          icon: 'info',
          title: 'Escaneo cancelado',
          text: 'El escaneo de QR ha sido cancelado.',
          confirmButtonColor: '#e4002b',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false
        });
      });
  
      function startScan(id) {
        const readerContainer = document.getElementById('reader-container');
        readerContainer.style.display = 'block';
  
        // Mostrar alerta de inicio de escaneo
        Swal.fire({
          icon: 'info',
          title: 'Escaneando QR',
          text: 'Coloca un código QR frente a la cámara',
          confirmButtonColor: '#e4002b',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
  
        qrScanner = new Html5Qrcode("reader");
        qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
          qrCodeMessage => {
            stopScan();
  
            // Verificar si el código QR ya está en uso
            valesRef.where('qr', '==', qrCodeMessage).get().then((querySnapshot) => {
              if (!querySnapshot.empty) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Este código QR ya está asignado a otro vale.',
                  confirmButtonColor: '#e4002b'
                });
                return;
              }
              
              // Confirmar asignación de QR
              Swal.fire({
                icon: 'question',
                title: 'Confirmar asignación',
                text: `¿Desea asignar este QR al vale ${id}?`,
                showCancelButton: true,
                confirmButtonText: 'Sí, asignar',
                cancelButtonText: 'No, cancelar',
                confirmButtonColor: '#e4002b',
                cancelButtonColor: '#6c757d'
              }).then((result) => {
                if (result.isConfirmed) {
                  // Asignar QR al vale
                  actualizarVale(id, {
                    qr: qrCodeMessage,
                    estado: 'Activado'
                  }).then(() => {
                    actualizarTabla();
                    Swal.fire({
                      icon: 'success',
                      title: '¡QR Asignado!',
                      text: `Vale ${id} activado correctamente.`,
                      confirmButtonColor: '#e4002b'
                    });
                  }).catch((error) => {
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'No se pudo asignar el código QR.',
                      confirmButtonColor: '#e4002b'
                    });
                  });
                }
              });
            }).catch((error) => {
              console.error("Error al verificar QR:", error);
              Swal.fire({
                icon: 'error',
                title: 'Error de verificación',
                text: 'No se pudo verificar si el QR ya está en uso.',
                confirmButtonColor: '#e4002b'
              });
            });
          },
          error => {
            // Ignorar errores de escaneo
          }
        ).catch(err => {
          console.error("Error al iniciar el escáner:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo iniciar la cámara. Verifica los permisos.',
            confirmButtonColor: '#e4002b'
          });
          document.getElementById('reader-container').style.display = 'none';
        });
      }
  
      function escanearQR() {
        const readerContainer = document.getElementById('reader-container');
        readerContainer.style.display = 'block';
  
        // Mostrar alerta de inicio de escaneo
        Swal.fire({
          icon: 'info',
          title: 'Escaneando QR',
          text: 'Coloca un código QR frente a la cámara',
          confirmButtonColor: '#e4002b',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
  
        qrScanner = new Html5Qrcode("reader");
        qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
          qrCodeMessage => {
            stopScan();
  
            // Buscar el vale por código QR
            valesRef.where('qr', '==', qrCodeMessage).get().then((querySnapshot) => {
              if (querySnapshot.empty) {
                Swal.fire({
                  icon: 'warning',
                  title: 'QR No Registrado',
                  text: 'Este código QR no está asignado a ningún vale en el sistema.',
                  confirmButtonColor: '#e4002b'
                });
                return;
              }
              
              const doc = querySnapshot.docs[0];
              const valeData = doc.data();
              const valeId = doc.id;
              
              if (valeData.estado === 'Activado') {
                Swal.fire({
                  icon: 'question',
                  title: '¿Desea canjear este vale?',
                  text: `Vale ${valeData.nombre} por $${valeData.edad}`,
                  showCancelButton: true,
                  confirmButtonText: 'Sí, canjear',
                  cancelButtonText: 'No, cancelar',
                  confirmButtonColor: '#e4002b',
                  cancelButtonColor: '#6c757d'
                }).then((result) => {
                  if (result.isConfirmed) {
                    const fechaActual = new Date().toISOString();
                    actualizarVale(valeId, {
                      estado: 'Canjeado',
                      fechaCanjeo: fechaActual
                    }).then(() => {
                      actualizarTabla();
                      Swal.fire({
                        icon: 'success',
                        title: '¡Vale Canjeado!',
                        text: `Vale ${valeData.nombre} canjeado exitosamente.`,
                        confirmButtonColor: '#e4002b'
                      });
                    }).catch((error) => {
                      console.error("Error al canjear vale:", error);
                      Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo canjear el vale.',
                        confirmButtonColor: '#e4002b'
                      });
                    });
                  }
                });
              } else if (valeData.estado === 'Canjeado') {
                const fechaFormateada = formatearFechaHora(valeData.fechaCanjeo);
                Swal.fire({
                  icon: 'error',
                  title: 'Vale Ya Canjeado',
                  html: `El vale ${valeData.nombre} ya ha sido canjeado.<br><br>
                        <b>Fecha y hora de canjeo:</b><br>
                        ${fechaFormateada}`,
                  confirmButtonColor: '#e4002b'
                });
              } else {
                Swal.fire({
                  icon: 'info',
                  title: 'Vale No Activo',
                  text: `El vale ${valeData.nombre} no está activo actualmente.`,
                  confirmButtonColor: '#e4002b'
                });
              }
            }).catch((error) => {
              console.error("Error al buscar QR:", error);
              Swal.fire({
                icon: 'error',
                title: 'Error de búsqueda',
                text: 'No se pudo verificar el código QR en la base de datos.',
                confirmButtonColor: '#e4002b'
              });
            });
          },
          error => {
            // Ignorar errores de escaneo
          }
        ).catch(err => {
          console.error("Error al iniciar el escáner:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo iniciar la cámara. Verifica los permisos.',
            confirmButtonColor: '#e4002b'
          });
          document.getElementById('reader-container').style.display = 'none';
        });
      }
  
      function desactivarQR() {
        const readerContainer = document.getElementById('reader-container');
        readerContainer.style.display = 'block';
  
        // Mostrar alerta de inicio de escaneo
        Swal.fire({
          icon: 'info',
          title: 'Escaneando QR',
          text: 'Coloca un código QR frente a la cámara para desactivarlo',
          confirmButtonColor: '#e4002b',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
  
        qrScanner = new Html5Qrcode("reader");
        qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
          qrCodeMessage => {
            stopScan();
  
            // Buscar el vale por código QR
            valesRef.where('qr', '==', qrCodeMessage).get().then((querySnapshot) => {
              if (querySnapshot.empty) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Atención',
                  text: 'Este código QR no está asignado a ningún vale.',
                  confirmButtonColor: '#e4002b'
                });
                return;
              }
              
              const doc = querySnapshot.docs[0];
              const valeData = doc.data();
              const valeId = doc.id;
              
              // Confirmar desactivación
              Swal.fire({
                icon: 'question',
                title: '¿Desea desactivar este vale?',
                text: `Vale ${valeData.nombre} por $${valeData.edad}`,
                showCancelButton: true,
                confirmButtonText: 'Sí, desactivar',
                cancelButtonText: 'No, cancelar',
                confirmButtonColor: '#e4002b',
                cancelButtonColor: '#6c757d'
              }).then((result) => {
                if (result.isConfirmed) {
                  const fechaActual = new Date().toISOString();
                  actualizarVale(valeId, {
                    estado: 'Canjeado',
                    fechaCanjeo: fechaActual
                  }).then(() => {
                    actualizarTabla();
                    Swal.fire({
                      icon: 'success',
                      title: '¡Vale Desactivado!',
                      text: `Vale ${valeData.nombre} desactivado correctamente.`,
                      confirmButtonColor: '#e4002b'
                    });
                  }).catch((error) => {
                    console.error("Error al desactivar vale:", error);
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'No se pudo desactivar el vale.',
                      confirmButtonColor: '#e4002b'
                    });
                  });
                }
              });
            }).catch((error) => {
              console.error("Error al buscar QR:", error);
              Swal.fire({
                icon: 'error',
                title: 'Error de búsqueda',
                text: 'No se pudo verificar el código QR en la base de datos.',
                confirmButtonColor: '#e4002b'
              });
            });
          },
          error => {
            // Ignorar errores de escaneo
          }
        ).catch(err => {
          console.error("Error al iniciar el escáner:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo iniciar la cámara. Verifica los permisos.',
            confirmButtonColor: '#e4002b'
          });
          document.getElementById('reader-container').style.display = 'none';
        });
      }
  
      // Manejar errores de conexión a Firebase
      function handleFirebaseError() {
        window.addEventListener('online', () => {
          Swal.fire({
            icon: 'success',
            title: 'Conexión restablecida',
            text: 'La conexión con la base de datos ha sido restablecida.',
            confirmButtonColor: '#e4002b',
            timer: 2000,
            timerProgressBar: true
          });
          cargarDatos();
        });
        
        window.addEventListener('offline', () => {
          Swal.fire({
            icon: 'warning',
            title: 'Sin conexión',
            text: 'Se ha perdido la conexión a internet. Algunas funciones pueden no estar disponibles.',
            confirmButtonColor: '#e4002b'
          });
        });
      }
  
      // Cargar datos al iniciar la página
      document.addEventListener('DOMContentLoaded', function() {
        cargarDatos();
        handleFirebaseError();
        
        // Escuchar cambios en tiempo real
        valesRef.onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "modified" || change.type === "added") {
              const docData = {...change.doc.data(), id: change.doc.id};
              const index = datos.findIndex(d => d.id === change.doc.id);
              
              if (index !== -1) {
                datos[index] = docData;
              } else {
                datos.push(docData);
              }
              actualizarTabla();
            }
          });
        }, (error) => {
          console.error("Error en tiempo real:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error de sincronización',
            text: 'No se pudo sincronizar con la base de datos en tiempo real.',
            confirmButtonColor: '#e4002b'
          });
        });
      });
      // Manejar envío del formulario para agregar vale manualmente
  document.getElementById('form-agregar-vale').addEventListener('submit', function (e) {
      e.preventDefault();
    
      const id = document.getElementById('input-id').value.trim();
      const edad = parseInt(document.getElementById('input-cantidad').value.trim(), 10);
    
      if (!id || isNaN(edad)) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos inválidos',
          text: 'Por favor completa todos los campos correctamente.',
          confirmButtonColor: '#e4002b'
        });
        return;
      }
    
      const nuevoVale = {
        nombre: id,
        edad: edad,
        qr: '',
        estado: 'Sin QR',
        fechaCanjeo: null
      };
    
      valesRef.doc(id).set(nuevoVale).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Vale agregado',
          text: `El vale ${id} fue agregado correctamente.`,
          confirmButtonColor: '#e4002b'
        });
        document.getElementById('form-agregar-vale').reset();
        cargarDatos(); // Vuelve a cargar los datos para actualizar la tabla
      }).catch((error) => {
        console.error("Error al agregar vale:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: 'Ocurrió un error al guardar el vale en Firebase.',
          confirmButtonColor: '#e4002b'
        });
      });
    });
    