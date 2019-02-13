# AW-FORM

El aw-form es un formulario para los componetes de Arisman Webs. Es una manera efectiva y cómoda de enviar los formularios compuestos por componentes de Arisman Webs de una forma similar a los formularios nativos del navegador pero con algunas funciones extras.

Como es de esperar, los componentes de formulario Arisman Webs no se pueden tratar como componentes normales al estar en el ShadowDom del navegador. De modo que este componente te permitirá enviarlos de forma intuitiva.

Incluir el componente:

```html
<script type="module" src="/node_modules/aw_polymer_3/polymer/polymer-element.js"></script>
<script type="module" src="/node_modules/aw_form/aw-form.js"></script>
```

Uso del componente

```html
<aw-form action="/scripts/my-script.php" method="post">
    <!-- Campos del formulario de Arisman Webs-->
</aw-form>
```

Los Atributos que podemos añadir al formulario son los clásicos que podemos añadir a cualquier formulario. Además de éstos, se pueden agregar algunos especiales que nos ayudarán a controlar el formulario con más precisión y facilidad que si fuese un formulario normal.

- `action`: El script donde dirigirá los datos el formulario.
- `method`: El método por el que se enviará el formulario.
- `enctype`: Codifica como se enviarán los datos del formulario.
- `autocomplete`: Determina si los campos del formulario se pueden autocompletar.
- `accept-charset`: La codificación del caracteres que acepta el formulario.
- `target`: Determina si se abre otra ventana al enviar el formulario o no.
- `novalidate`: Evita la validación de los campos del fomulario al ser enviado.
- `connectedfunc` (<font style="color: #01A9DB">aw_extern_functions</font>): Que se invoca al conectar el formulario.
- `submitfunc` (<font style="color: #01A9DB">aw_extern_functions</font>): Función a la que se envían los datos para ser validados (Evita el envío del formulario por defecto).

Las validaciones del formulario se apoyan en el ***aw-form-validate-mixin***, para ver la lista entera de validaciones posibles pulsa <a href="https://www.npmjs.com/package/aw_form_mixins#aw-form-validate-mixin">aquí</a>

## Ejemplos de aw-form

Formulario simple que permite autocompletar campos y todos los campos son obligatorios:

```html
<aw-form action="/scripts/my_script.php" method="get">
    <aw-input name="nombre" label="Nombre" required minlength="5"></aw-input>
    <aw-input name="apellidos" label="Apellidos" required minlength="5"></aw-input>
    <aw-input type="email" name="email" label="Correo electrónico" required maxlength="40" countchar></aw-input>
    <aw-button type="submit">ENVIAR</aw-button>
</aw-form>
```
___

Formulario que no permite el autocompletar y no valida los campos antes de enviarlo:

```html
<aw-form action="/scripts/my_script.php" method="get" autocomplete="off" novalidate>
    <aw-input name="nombre" label="Nombre" required minlength="5"></aw-input>
    <aw-input name="apellidos" label="Apellidos" required minlength="5"></aw-input>
    <aw-input type="email" name="email" label="Correo electrónico" required maxlength="40" countchar></aw-input>
    <aw-button type="submit">ENVIAR</aw-button>
</aw-form>
```
___

Formulario que obliga que un campo de confirmar password coincida con el del password:

```html
<aw-form action="/scripts/my_script.php" method="get" autocomplete="off">
    <aw-input name="nombre" label="Nombre" required minlength="5"></aw-input>
    <aw-input name="apellidos" label="Apellidos" required minlength="5"></aw-input>
    <aw-input type="email" name="email" label="Correo electrónico" required maxlength="40" countchar></aw-input>
    <aw-input type="password" name="password" label="Contraseña" required></aw-input>
    <aw-input type="password" name="confirm" label="Confirmar contraseña" required equalto="password"></aw-input>
    <aw-button type="submit" width="100%">ENVIAR</aw-button>
</aw-form>
```
___

Al validar el formulario, los campos con errores nos mostrarán mensajes por defectos. En ocasiones podemos querer que nos muestre mensajes más específicos cuando un campo esté mal completado. Para el caso tendremos que hacer uso de `connectedfunc` y configuraremos los mensajes a voluntad de la siguiente forma:

```html
<aw-form action="/scripts/my_script.php" method="post" connectedfunc="setMessages">
    <aw-input name="nombre" label="Nombre" required minlength="5"></aw-input>
    <aw-input name="apellidos" label="Apellidos" required minlength="5"></aw-input>
    <aw-input type="email" name="email" label="Correo electrónico" required maxlength="40" countchar></aw-input>
    <aw-button type="submit" width="100%">ENVIAR</aw-button>
</aw-form>
```

```javascript
function setMessages( awForm ) {
  awForm.validator.messages = {
    nombre: { 
        required: "El nombre es obligatorio",
        minlength: "El nombre tiene que tener al menos 5 caracteres" },
    apellidos: { 
        required: "El apellido es obligatorio",
        minlength: "El apellido tiene  que tener al menos 5 caracteres" },
    email: { 
        required: "El email es obligatorio", 
        isemail: "No has introducido un email válido" }
  }
}
```

Como podemos apreciar, en el objeto `awForm.validator.messages` hacemos referenia a los nombres de los campos, y dentro de éstos a los nombres de las reglas de validación. De este modo, para cada campo y cada regla que queramos podemos mostrar el mensaje que mejor nos convenga. No es necesario añadirlos todos, los que no modifiquemos mostrarán su valor por defecto.
___

Formulario que utiliza una función externa para tratar el formulario. Útil se se quiere utilizar AJAX para validar o enviar un formulario:

```html
<aw-form autocomplete="off" submitfunc="Formulario.submit">
    <aw-input name="nombre" label="Nombre" required minlength="5"></aw-input><br>
    <aw-input name="apellidos" label="Apellidos" required minlength="5"></aw-input><br>
    <aw-input type="email" name="email" label="Correo electrónico" required maxlength="40" countchar></aw-input><br>
    <aw-button type="submit" width="100%">Enviar</aw-button>
</aw-form>
<div id="output"></div>
```

```javascript
class Formulario {
    static submit( response ) {
        // Mostramos la respuesta en la consola
        console.log( response );
		
        // Comprobamos que el campo apellidos tenga dos palabras   
        let apellidos = response.inputs.apellidos.value.split( " " );

        if( !apellidos[ 1 ] ) {
            // Ponemos mensaje de error en el campo y el focus
            response.inputs.apellidos.setAttribute( "errmsg", "Tienes que introducir tus dos apellidos");
            response.inputs.apellidos.focus();

            // Quitamos la carga del botón y retornamos false        
            response.button.loading = false;
            return false;
        }

        //... hacemos el resto de operaciones
    }
}
```
En el ejemplo anterior pasamos el formulario por el método `submit()` de la clase `Formulario`, y en este método validamos que el campo apellidos tenga dos palabras. De no ser así mostramos un mensaje personalizado de error en el campo apellidos y ponemos el focus en éste. Si por el contario validara, podríamos seguir haciendo las operaciones que consideremos oportunas.
______________________________

<p style="text-align: center; padding: 50px 0">
    <b>Contacto</b><br><br>Manu J. Overa<br><a href="mailto:manu.overa@arismanwebs.es">manu.overa@arismanwebs.es</a><br><br>
    Diseño Web - <a href="https://arismanwebs.es">Arisman Webs</a>
</p>