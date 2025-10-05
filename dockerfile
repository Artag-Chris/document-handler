# Usa una imagen base de Node.js en su versión 21-alpine3.19
FROM node:23

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia el archivo package.json y pnpm-lock.yaml al directorio de trabajo
COPY package.json ./
COPY package-lock.json ./

# Instala pnpm y las dependencias del proyecto
# Nota: Añadimos la instalación de pnpm globalmente antes de usarlo para instalar dependencias
RUN npm install 

# Copia el resto de los archivos del proyecto al directorio de trabajo
COPY . .

# Expone el puerto 35715
EXPOSE 6133

