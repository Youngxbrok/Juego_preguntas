# Usamos una imagen ligera de Nginx
FROM nginx:alpine

# Copiamos todos los archivos del repo a la carpeta de servidor de Nginx
COPY . /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80
