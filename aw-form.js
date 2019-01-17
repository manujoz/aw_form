
import { PolymerElement, html } 		from "/node_modules/aw_polymer_3/polymer/polymer-element.js";

import { AwFormValidateMixin } 			from '/node_modules/aw_form_mixins/aw-form-validate-mixin.js';
import { AwExternsFunctionsMixin } 		from '/node_modules/aw_extern_functions/aw-extern-functions-mixin.js';

class AwForm extends AwFormValidateMixin( AwExternsFunctionsMixin ( PolymerElement )) {
	static get template() {
		return html`
		<style>
			form * {
				display: none;
			}
			button {
				display: none;
			}
		</style>
		<slot></slot>
        <div id="container">
            <form
                id$="[[id]]"
                action$="[[action]]"
                method$="[[method]]"
                enctype$="[[enctype]]"
                autocomplete$="[[autocomplete]]"
                accept-charset$="[[accept-charset]]"
                target$="[[target]]"
				novalidate
                ><button type="submit"></button></form>
        </div>
		`;
	}
	
	static get properties() {
		return {
			// Objeto del formulario

			formulario: Object,

			// Propiedades del formulario

			id: { type: String },
			action: { type: String },
			method: { type: String },
			enctype: { type: String },
			autocomplete: { type: String },
			'accept-charset': { type: String },
			target: { type: String },
			novalidate: { type: Boolean, value: false },

			// Variables de funcionamiento

			tested: { type: Boolean, value: false },
			ghostform: { type: Boolean, value: false },
			response: { type: Object }
		}
	}
	
	/**
	 * @method	constructor
	 * 
	 * Configura el componente en la construcción de la clase.
	 */
	constructor() {
		super();
			
		// Definimos en el connectedCallback las propiedades de elementos y valores iniciales
		// si lo hiciéramos en las propiedades del elemento personalizado no funcionaría correctamente el 
		// registro de los elementos que estén dentro

		this.elements = [];
		this.elementsInitValue = [];
		this.buttonSubmit = null;

		this.functions = {
			register_element: ( ev ) => this._register_element( ev ),
			register_button: ( ev ) => this._register_button_submit( ev ),
			submit: ( ev ) => this._submit_ghost_form( ev ),
		};

		// Listeners

		this.addEventListener('aw-form-element-register', this.functions.register_element, true );
		this.addEventListener('aw-form-submit-register', this.functions.register_button, true );
	}
	
	/**
	 * @method	coneectedCallback
	 * 
	 * Acciones al conectar el componente.
	 */
	connectedCallback() {
		super.connectedCallback();

		// Asignamos el formulario

		this.formulario = this.$.container.querySelector( "form" );
		this.formulario.addEventListener( "submit", this.functions.submit, true);
	}
	
	/**
	 * @method	disconnectedCallback
	 * 
	 * Acciones al desconectar el componente.
	 */
	disconnectedCallback(){
		super.disconnectedCallback();

		// Apagamos los listeners

		this.removeEventListener( "aw-form-element-register", this.functions.register_element, true );
		this.removeEventListener('aw-form-submit-register', this.functions.register_button, true );
		this.formulario.removeEventListener( "submit", this.functions.submit, true);
	}

	/**
	 * @method	_registerElement
	 * 
	 * Registra un inputElement en el formulario.
	 * 
	 * El elemento viene dado en el *ev.detail*. Buscamos en el array de elementos registrados
	 * si ya existe ese input y si no lo regustramos
	 * 
	 * @param	{object}		ev			Evento devuelto por el addEventListener.
	 */
	_register_element( ev ) {
		let element = ev.detail;
		let input = element.inputElement;
		
		let index = this.elements.indexOf( input );

		if ( index === -1 ) {
			element.parentForm = this;

			this.elements.push( input );
			this.elementsInitValue.push( input.value );
		}
	}

	/**
	 * @method	_registerButtonSubmit
	 * 
	 * Reistra el botón de submit en el formulario.
	 * 
	 * El botón viene dado en el *ev.detail* y lo asignamos.
	 * 
	 * @param	{object}		ev			Evento devuelto por el addEventListener.
	 */
	_register_button_submit( ev ) {
		var element = ev.detail;

		element.parentForm = this;
		this.buttonSubmit = element;
	}

	/**
	 * @method	_unregisterElement
	 * 
	 * Desregistra un inputElement del formulario.
	 * 
	 * @param	{node}			element		inputElement que queremos desregistrar.
	 */
	_unregister_element( element ) {
		// Buscamos en this.elements si el elemento está en el array con la función indexOf
		// Si el index es mayor a -1, el elemento está en el array y lo eliminamos con la función .splice()

		var index = this.elements.indexOf( element );

		if( index > -1 ) {
			this.elements.splice( index, 1 );
			this.elementsInitValue.splice( index, 1 );
		}
	}

	/**
	 * @method	_unregisterButtonSubmit
	 * 
	 * Desregistra el botón de submit del formulario.
	 */
	unregister_button_submit() {
		this.buttonSubmit = null;
	}

	/**
	 * @method	submit
	 * 
	 * Envía el formulario.
	 */
	submit() {
		// Si el botón está cargando se cancela
			
		if ( this.buttonSubmit && this.buttonSubmit.loading ) {
			return false;
		}
			
		// Creamos el objeto de respuesta
			
		this.response = {
			inputs: this._inputs_response(),
			error: false,
			errorRule: null,
			errorField: null,
			button: this.buttonSubmit
		};

		// Rellenamos el formulario fantasma.

		this._fill_ghost_form();
		
		// Validamos el formulario
		
		if ( !this.novalidate ) {
			var formclone = this.formulario.cloneNode( true );
			var validator = this.__validateAwForm( this.elements, formclone );
			
			this.response.error = validator.error;
			this.response.errorRule = validator.errorRule;
			this.response.errorField = validator.errorField;
		}
			
		// Ponemos el botón cargando si corresponde
		
		if( this.buttonSubmit && !this.response.error ) {
			this.buttonSubmit.loading = true;
		}
			
		// Enviamos el formulario
		
		this.shadowRoot.querySelector( "form button" ).click();
	}

	/**
	 * @method	_submit_ghost_form
	 * 
	 * Envia el formulario fantasma al hacer submit sobre él. Hará un preventDefault si
	 * hay función de resupuesta AJAX o si es FALSE el parámetro ghostform, que se volverá TRUE
	 * solo cuando haya rellenado el formulario para el envío de ghostform.
	 * 
	 * @param	{object}		ev		Evento devuelto por el submit del formulario.
	 */
	_submit_ghost_form( ev ) {
		if ( typeof this.submitfunc === "function" ) {
			ev.preventDefault();
			this.submitfunc( this.response );
		} else if ( this.response.error ) {
			ev.preventDefault();
		} else if( !this.ghostform ) {
			ev.preventDefault();
			this._fill_ghost_form_to_submit();
			this.formulario.submit();
		}
	}

	/**
	 * @method	_inputs_response
	 * 
	 * Asigna los inputs registrados a la respuesta.
	 */
	_inputs_response() {
		var inputs = {};
		
		for( var i = 0; i < this.elements.length; i++ ) {
			var element = this.elements[ i ];
			inputs[ element.name ] = element;
		}
			
		inputs = this._adjust_inputs_radio( inputs );

		return inputs;
	}

	/**
	 * @method	_adjust_inputs_radio
	 * 
	 * Ajusta los inputs type radio para que funcionen cono se espera.
	 * 
	 * @param	{object}		inputs		Objeto con todos los inputs del formulario.
	 */
	_adjust_inputs_radio( inputs ) {
		for( var prop in inputs ) {
			if( inputs.hasOwnProperty( prop )) {
				if( inputs[ prop ].type === "radio" ) {
					var name = inputs[ prop ].name;
					
					for( var r = 0; r < this.elements.length; r++ ) {
						if( this.elements[ r ].name === name && this.elements[ r ].checked ) {
							inputs[ prop ] = this.elements[ r ];
							break;
						}
					}
				}
			}
		}
		
		return inputs;
	}

	/**
	 * @method	_fill_ghost_form
	 * 
	 * Rellena el formulario fantasma con todos los inputs.
	 */
	_fill_ghost_form() {
		this._empty_ghost_form();

		for( var i = 0; i < this.elements.length; i++ ) {
			var input = this.elements[ i ];
				
			var inputclon = input.cloneNode( true );			
			this.formulario.appendChild( inputclon );
		}
	}

	/**
	 * @method	_fill_ghost_form_to_submit
	 * 
	 * Rellena el formulario fantasma para un sbumit sin función de respuesta.
	 */
	_fill_ghost_form_to_submit() {
		this._empty_ghost_form();
			
		// Reccorremos todos los elementos, validamos y añadimos al formulario
		
		for( var i = 0; i < this.elements.length; i++ ) {
			var input = this.elements[ i ];
			
			if( input.getAttribute( "type" ) !== "file" ) {
				var inputclon = input.cloneNode( true );

				this.formulario.appendChild( inputclon );
			} else {
				this.formulario.appendChild( input );
			}
		}
		this.ghostform = true;
	}

	/**
	 * @method	_empty_ghost_form
	 * 
	 * Vacía el formulario fantasma de inputs.
	 */
	_empty_ghost_form() {
		this.ghostform = false;
		this.formulario.innerHTML = '<button type="submit">ES</button>';
	}
}

window.customElements.define( "aw-form", AwForm );