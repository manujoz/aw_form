interface AwForm extends HTMLElement {
	/** Asigna la función de submit */
	submitfunc: Function,
	/** Resetea el formulario al enviarse si es true */
	clearOnSubmit: boolean,
	/** Validador */
	validator: AwFormValidator

	/**
	 * @method	reset
	 * 
	 * Resetea todos los campos del formulario
	 */
	reset(): void,

	/**
	 * @method	submit
	 * 
	 * Envía el formulario
	 */
	submit(): void,
}

declare var AwForm: {
	prototype: AwForm,
	new(): AwForm
}

interface AwFormValidator {
	messages: {
		/** Nombre del input */
		[index:string]: {
			isemail: string,
			isurl: string,
			required: string,
			nospaces: string,
			minlength: string,
			rangelength: string,
			isnumber: string,
			min: string,
			max: string,
			range: string,
			domains: string,
			isdate: string,
			dateprevius: string,
			minage: string,
			maxage: string,
			security: string,
			equalto: string,
			phonenumber: string,
			phonecountry: string,
			pattern: string,
			allowed: string,
			mincheck: string,
			maxcheck: string,
		}
	}
}

declare var AwFormValidator: {
	prototype: AwFormValidator,
	new(): AwFormValidator
}

interface AwFormResponse
{
	inputs: {
		[ index:string ]: HTMLInputElement
	},
	error: boolean,
	errorRule: string,
	errorField: HTMLInputElement,
	button: AwButton
}

declare var AwFormResponse: {
	prototype: AwFormResponse,
	new(): AwFormResponse
}