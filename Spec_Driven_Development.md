# Especificación del Sistema: Control de Insumos Web (PAB-IN) V3

## 1. Visión General del Proyecto
Sistema web liviano (Single Page Application - SPA) diseñado para sustituir el registro manual en Excel de distribución de insumos (Papel Higiénico y Jabón) por pabellones, pisos y baños en la universidad.

### Datos del Proyecto en Firebase
- **Nombre del Proyecto:** Control de Insumos Web
- **ID del Proyecto (Project ID):** `control-de-insumos-web`
- **Alias de la App Web:** `control-de-insumos-web`

### Stack Tecnológico
- **Frontend:** HTML5, JavaScript vanilla (ES6 Modules) y Tailwind CSS (vía CDN) para una interfaz ágil sin necesidad de empaquetadores complejos.
- **Backend & DB:** Firebase (Authentication, Firestore Database, Firebase Hosting, Analytics).
- **Infraestructura:** 100% en la capa gratuita de Firebase (Spark Plan).

---

## 2. Requisitos Funcionales y No Funcionales

### 2.1 Requisitos Funcionales (RF)

| Código | Nombre | Descripción |
| :--- | :--- | :--- |
| **RF-01** | Autenticación Diferenciada por Rol | El sistema debe permitir el inicio de sesión para Administradores (Correo Institucional + Contraseña) y Operadores (Correo Institucional + DNI como contraseña). El sistema redirigirá al usuario según su rol en Firestore. |
| **RF-02** | Registro de Entregas por Operador | Permitir a los operadores registrar entregas seleccionando el insumo, pabellón, piso y cantidades desglosadas por baño (Damas, Varones, Discapacitado). Autocompletar la fecha y el nombre del encargado con los datos de la sesión activa. |
| **RF-03** | Registro Flexible de Entregas en Lote (Almacén) | Permitir guardar entregas sin especificar piso ni baños cuando se realicen despachos generales a almacén. El sistema debe marcar automáticamente estos registros con el estado `POR_REGULARIZAR`. |
| **RF-04** | Cálculo y Validación Automática de Cantidades | Calcular automáticamente la Cantidad Total sumando los baños cuando se ingresen montos específicos. Si se ingresan datos manualmente, debe validar que la suma total sea exactamente igual al desglose. |
| **RF-05** | Módulo de Regularización para Administrador | Permitir al administrador filtrar las entregas en estado `POR_REGULARIZAR` y actualizarlas asignando el piso y/o desglose de baños correspondiente, cambiando el estado a `REGULARIZADO` y registrando auditoría. |
| **RF-06** | Gestión de Usuarios (CRUD) | El administrador debe poder crear nuevos operadores y administradores (asignando correo, DNI, nombre completo y rol) y cambiar su estado de acceso (activar/desactivar). |
| **RF-07** | Gestión de Catálogos (CRUD) | El administrador debe poder agregar, modificar y eliminar los pabellones (código, nombre, pisos máximos) e insumos habilitados en el sistema. |
| **RF-08** | Filtros de Búsqueda y Exportación a Excel/CSV | Permitir al administrador filtrar los registros de entregas por rango de fechas, insumo, pabellón y estado, ofreciendo la opción de descargar los datos filtrados en formato `.xlsx` o `.csv` vía SheetJS. |

### 2.2 Requisitos No Funcionales (RNF)

| Código | Nombre | Criterio de Aceptación / Restricción Tecnológica |
| :--- | :--- | :--- |
| **RNF-01** | Costo Cero (Spark Plan Firebase) | El sistema debe operar exclusivamente dentro de los límites de la cuota gratuita de Firebase (Firestore: max. 20,000 escrituras y 50,000 lecturas diarias; Hosting: max. 10 GB almacenamiento y 360 MB/día transferencia). |
| **RNF-02** | Rendimiento y Carga Ligera (Zero Build) | La aplicación no debe depender de procesos pesados de compilación/transpilación (Webpack, Vite, React). Debe construirse como una SPA en HTML5 y módulos JS ES6 nativos para una carga rápida en navegadores móviles y de escritorio. |
| **RNF-03** | Usabilidad y Diseño Responsivo | La interfaz debe ser intuitiva y adaptarse a dispositivos móviles (smartphones/tablets de los operadores) y computadoras de escritorio mediante Tailwind CSS. |
| **RNF-04** | Seguridad a Nivel de Base de Datos | Toda la lógica de permisos debe estar respaldada mediante *Firestore Security Rules*, garantizando que un operador no pueda editar/eliminar registros ni consultar colecciones de administración desde la consola del navegador. |
| **RNF-05** | Trazabilidad e Integridad de Datos | Todos los registros deben guardar marcas de tiempo del servidor (`serverTimestamp()`) y asociarse al UID del usuario autenticado sin permitir alteración manual del campo de encargado. |

---

## 3. Arquitectura de Archivos y Carpetas del Proyecto

Estructura modular en JavaScript ES6 recomendada para desplegar directamente en la carpeta `public/` de Firebase Hosting sin proceso de build:

```text
control-de-insumos-web/
├── .gitignore
├── firebase.json                 # Configuración de Hosting y rewrites de SPA
├── firestore.rules               # Reglas de seguridad de Firestore
├── firestore.indexes.json        # Índices de Firestore
├── package.json                  # Mantenimiento de dependencias
│
└── public/                       # Carpeta desplegada en Firebase Hosting
    ├── index.html                # Contenedor único de la SPA (Tailwind + SheetJS)
    │
    ├── assets/                   # Recursos estáticos (CSS, Imágenes/Logo)
    │   ├── css/
    │   │   └── styles.css
    │   └── img/
    │       └── logo.png
    │
    └── js/                       # Lógica de la aplicación (Módulos JS)
        ├── firebase-config.js    # Inicialización del SDK de Firebase
        ├── app.js                # Enrutador principal y manejo de sesión
        │
        ├── services/             # Capa de interacción directa con Firebase
        │   ├── auth.service.js   # Login, Logout y verificación de roles
        │   ├── entregas.service.js# CRUD de entregas y regularización
        │   ├── catalogos.service.js# Carga y edición de pabellones/insumos
        │   └── users.service.js  # Registro y gestión de usuarios
        │
        ├── views/                # Componentes/Vistas dinámicas (HTML en JS)
        │   ├── login.view.js     # Vista de Inicio de Sesión
        │   ├── operador.view.js  # Formulario de registro de entregas
        │   └── admin.view.js     # Panel Admin (Tabs, Tabla y Modales)
        │
        └── utils/                # Utilidades auxiliares
            ├── export.js         # Exportación a Excel/CSV vía SheetJS
            └── validators.js     # Validaciones de formulario (Suma de baños)
```

---

## 4. Modelo de Autenticación y Usuarios

### 4.1 Roles de Usuario

| Rol | Mecanismo de Autenticación | Permisos y Acceso |
| :--- | :--- | :--- |
| **Administrador** | Correo institucional + Contraseña segura | Panel de administración completo, gestión de usuarios, gestión de catálogos, edición/regularización de entregas pendientes y exportación de reportes. |
| **Operador** | Correo institucional + DNI (como contraseña inicial) | Formulario de registro rápido de entregas y consulta de sus propios registros del día. |

---

## 5. Arquitectura de Base de Datos (Firestore)

### 5.1 Colección: `users`
```json
{
  "uid": "string (Firebase Auth UID)",
  "correo": "operador@univer.edu.pe",
  "nombre_completo": "JEAN ARRIETA",
  "dni": "70123456",
  "rol": "OPERADOR | ADMIN",
  "activo": true,
  "created_at": "timestamp"
}
```

### 5.2 Colección: `catalogos`
**Documento:** `pabellones`
```json
{
  "lista": [
    { "codigo": "N", "nombre": "Pabellón N", "max_pisos": 5 },
    { "codigo": "H", "nombre": "Pabellón H", "max_pisos": 8 },
    { "codigo": "IC", "nombre": "Ingeniería Civil", "max_pisos": 4 }
  ]
}
```

**Documento:** `insumos`
```json
{
  "lista": ["PAPEL_HIGIENICO", "JABON"]
}
```

### 5.3 Colección: `registros_entrega`
```json
{
  "id": "auto_generated",
  "fecha_registro": "YYYY-MM-DD",
  "insumo": "PAPEL_HIGIENICO",
  "cantidad_total": 12,
  "pabellon": "IC",
  "piso": null,
  "detalle_banos": {
    "damas": 0,
    "varones": 0,
    "discapacitado": 0
  },
  "estado": "POR_REGULARIZAR",
  "encargado": {
    "uid": "user_uid_here",
    "nombre": "CELIA GUTARRA",
    "dni": "12345678"
  },
  "observaciones": "Entrega directa a almacén de pabellón",
  "regularizado_por": null,
  "fecha_regularizacion": null,
  "timestamp": "serverTimestamp()"
}
```

---

## 6. Requerimientos Funcionales y Flujos de Pantalla

### 6.1 Login (`/login`)
- **Campos:** Correo Institucional y Contraseña (DNI para Operadores).
- **Lógica:** Al autenticar contra Firebase Auth, se consulta el documento del usuario en Firestore para verificar el rol y redireccionar según corresponda.

### 6.2 Módulo Operador: Formulario de Registro (`/registro`)
- **Encabezado:** Despliega el nombre del operador logueado y la fecha actual.
- **Campos del Formulario:**
  1. Tipo de Insumo (Selector: Papel Higiénico / Jabón).
  2. Pabellón (Selector dinámico de catálogo).
  3. Piso (Numérico opcional).
  4. Desglose por Baños (Opcional: Damas, Varones, Discapacitados).
  5. Cantidad Total:
     - **Automático:** Se calcula como `Damas + Varones + Discapacitado` si se llenan dichos campos.
     - **Lote / Almacén:** Si Piso y Baños quedan vacíos, se ingresa la Cantidad Total directamente y el estado del registro se marca como `POR_REGULARIZAR`.

### 6.3 Módulo Administrador (`/admin`)
- **Tab 1: Panel de Control y Regularización:** Visualización general con filtros por rango de fechas, insumo, pabellón y estado. Los registros `POR_REGULARIZAR` permiten abrir un modal para asignar el piso o desglosar los baños, cambiando el estado a `REGULARIZADO`. Incluye botón de exportación a CSV/Excel.
- **Tab 2: Gestión de Usuarios:** Formulario para registrar nuevos operadores o administradores con su correo, DNI, nombre y rol, así como opción de desactivar acceso.
- **Tab 3: Configuración de Catálogos:** CRUD de pabellones (código, nombre, pisos) e insumos disponibles.

---

## 7. Configuración e Implementación en Firebase Hosting

### 7.1 Instalación de herramientas CLI
```bash
npm install -g firebase-tools
```

### 7.2 Inicialización del Proyecto
```bash
firebase login
firebase init
```

### 7.3 Registro de la App y Configuración del SDK
```bash
npm install firebase
```

Archivo `public/js/firebase-config.js`:
```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyARQrX_95ep1n6QbktF0FjhV51qtLdSxes",
  authDomain: "control-de-insumos-web.firebaseapp.com",
  projectId: "control-de-insumos-web",
  storageBucket: "control-de-insumos-web.firebasestorage.app",
  messagingSenderId: "333088496966",
  appId: "1:333088496966:web:9d44ce0f2619f3132c1947"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 7.4 Implementación (Deploy)
```bash
firebase deploy
```

---

## 8. Reglas de Seguridad de Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.rol;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && getRole() == 'ADMIN';
    }

    match /catalogos/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && getRole() == 'ADMIN';
    }

    match /registros_entrega/{entregaId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && getRole() == 'ADMIN';
    }
  }
}
```