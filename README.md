# ![logo gambitero](https://raw.githubusercontent.com/oveigam/gambitero-app/master/assets/favicon.png) Gambitero

Gestiona y organiza planes (*"gambiteos"*) con tus amigos!

Organizar planes por un chat de grupo puede ser una tarea costosa, la fauna típica del chat siempre incluye al que no lee el chat, el que no le apetece leer la discusión y pide que se la resuman y mi favorito, el que decide hablar del partido de fútbol mientras los demás intentan ponerse de acuerdo en un plan.

Con Gambitero puedes organizar los planes de manera individual e ir indicando los detalles que se van confirmando para que nadie tenga que preguntar por el chat a que hora se queda o cualquier tontería de la que ya se habló!

> Este es el repositorio del backend para la aplicación Gambitero. 
> Puedes ver el repositorio de la app móvil [aquí](https://github.com/oveigam/gambitero-app).

## Tech

Lista de tecnologías (principales) usadas para desarrollar la aplicación:
-  **Node/Express:** Para crear el servidor con una REST API
-  **MongoDB:** Base de datos, usando mongoose como ODM
-  **Socket IO:** Websockets para poder mostrar datos en tiempo real
- **JSON Web Token:** Para gestionar la autenticación de usuarios

## Installation

"Gambitero" necesita [Node](https://nodejs.org/en/download/) y conexión a una base de datos [mongoDB](https://www.mongodb.com/).

Una vez descargado el código instalar las dependencias.
```sh
npm install
```
E iniciar el servidor

En desarrollo (con nodemon)
```sh
npm run dev
```

o en produccion
```sh
npm start
```

## Demo
> Puedes encontrar info sobre la demo y varias cosas más en el repositorio de la [app móvil](https://github.com/oveigam/gambitero-app)
