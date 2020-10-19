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