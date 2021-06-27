
import { PolymerElement, html } 		from "../aw_polymer_3/polymer/polymer-element.js";
import { AwFormValidateMixin } 			from '../aw_form_mixins/aw-form-validate-mixin.js';
import { AwExternsFunctionsMixin } 		from '../aw_extern_functions/aw-extern-functions-mixin.js';

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
			clearOnSubmit: { type: Boolean },

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

		/** @type {HTMLInputElement[]} */
		this.elements = [];
		this.elementsInitValue = [];
		this.buttonSubmit = null;
		this.clearOnSubmit = false;

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
	 * @method	reset
	 * 
	 * Resetea el formulario
	 */
	reset() {
		this.elements.forEach(inputEl => {
			let parent = inputEl.parentNode;
			while(parent.toString() !== "[object ShadowRoot]") {
				parent = parent.parentNode;
			}

			const component = parent.host;
			if(typeof component.clear === "function") {
				component.clear();
			}
		})
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
		// NOTE: Si es móvil haremos un submit, de lo contrario, haremos un click en el boton como un evento
		if( this._is_phone() ) {
			this.functions.submit();
		} else {
			this.shadowRoot.querySelector( "form button" ).click();
		}

		if(this.clearOnSubmit) {
			this.reset();
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
	 * @method	_empty_ghost_form
	 * 
	 * Vacía el formulario fantasma de inputs.
	 */
	_empty_ghost_form() {
		this.ghostform = false;
		this.formulario.innerHTML = '<button type="submit">ES</button>';
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
	 * @method	_is_phone
	 */
	_is_phone() {
		return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk/i.test(navigator.userAgent||navigator.vendor||window.opera)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test((navigator.userAgent||navigator.vendor||window.opera).substr(0,4)));
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
			if( ev ) {
				ev.preventDefault();
			}			
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
}

window.customElements.define( "aw-form", AwForm );