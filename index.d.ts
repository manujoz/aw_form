interface AwForm extends HTMLElement {
	/** Asigna la función de submit */
	submitfunc: Function,

	/** Resetea el formulario al enviarse si es true */
	clearOnSubmit: boolean,

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