import {IInputs, IOutputs} from "./generated/ManifestTypes";


export class NZPostAutoComplete implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private localNotifyOutputChanged: () => void;
	private context: ComponentFramework.Context<IInputs>;
	private container: HTMLDivElement;
	private refreshData: EventListenerOrEventListenerObject;

	// input element that is used to create the autocomplete
	private inputElement: HTMLInputElement;

	// Datalist element.
	private datalistElement: HTMLDataListElement;

	private nzpost_client_id: string | null;
	private nzpost_client_secret: string | null;

	private id: string;

	constructor()
	{

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{

		this.localNotifyOutputChanged = notifyOutputChanged;
		this.context = context;
		this.nzpost_client_id = context.parameters.nzpost_client_id.raw;
		this.nzpost_client_secret = context.parameters.nzpost_client_secret.raw;
		
		// @ts-ignore
		this.id = context.parameters.value.attributes.LogicalName;

		// Assinging enviroment vairable.
		this.context = context;
		this.container = document.createElement("div");
		this.inputElement = document.createElement("input");
		this.inputElement.name = "autocomplete_" + this.id
		this.inputElement.placeholder = "---";
		this.inputElement.autocomplete = "off";
		this.inputElement.className = "pcfCustomField"
		this.inputElement.setAttribute("list", "list_" + this.id);


		// Get initial values from field.
		// @ts-ignore
		this.inputElement.value = Xrm.Page.getAttribute(context.parameters.value.attributes.LogicalName).getValue();

		// Add an eventlistner the element and bind it to a  function.
		this.inputElement.addEventListener("input", this.getSuggestions.bind(this));
						
		// creating HTML elements for data list 
		this.datalistElement = document.createElement("datalist");
		this.datalistElement.id = "list_" + this.id;

		var optionsHTML = "";

		//@ts-ignore 
		this.datalistElement.innerHTML = optionsHTML;
					
		// Appending the HTML elements to the control's HTML container element.
		// Add input element
		this.container.appendChild(this.inputElement);

		//Add datalist element
		this.container.appendChild(this.datalistElement);
		container.appendChild(this.container);	
	}

	public getSuggestions(evt: Event) {

		// Connect to an API and get the suggesstion as user key presses and update dropdown.
		console.log("getSuggestions")
		let key = "DPID"
		let input = (this.inputElement.value as any) as string;
		if (input.indexOf(key) == -1)
		{
			this.datalistElement.innerHTML = "";
			let query = "/suggest?q=" + input + "&type=All&max=20&client_id=" + this.nzpost_client_id + "&client_secret=" + this.nzpost_client_secret;
			let options = {
				host: 'api.nzpost.co.nz/privateaddresschecker/1.0',
				path: query,
				headers: {
					'accept': 'application/json'
				}
			}
			const https = require('https');

			https.get(options, (resp: any) => {
				let data = '';			
				// A chunk of data has been recieved.
				resp.on('data', (chunk: any) => {
				data += chunk;
				});		  
				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					var response = JSON.parse(data);
					console.log();
					console.log(response.addresses);
					var optionsHTML = "";
					var optionsHTMLArray = new Array();
					for (var i = 0; i < response.addresses.length; i++) {
					// Build the values for the AutoComplete Array and Add ID for after select use.
						optionsHTMLArray.push('<option value="');
						optionsHTMLArray.push(response.addresses[i].FullAddress + ". DPID: " + response.addresses[i].DPID);
						optionsHTMLArray.push('">  Address Type: ' + response.addresses[i].SourceDesc + '</option>');						
					}
					this.datalistElement.innerHTML = optionsHTMLArray.join("");  
					this.localNotifyOutputChanged  
				});

			}).on("error", (err: { message: string; }) => {
				console.log("Error: " + err.message);
			});		
		}
		else {
			this.localNotifyOutputChanged()
		}		
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		console.log("updateView");
		console.log("setSelected");
		// set the key to lok for in the input that was placed above.
		let key = "DPID"
		let value = this.inputElement.value
		if (value.indexOf(key) > -1){
			let _dpid = value.substring(value.indexOf(key) + 6, value.length);
			var query = "/details?type=All&dpid=" + _dpid + "&max=20&client_id=" + this.nzpost_client_id + "&client_secret=" + this.nzpost_client_secret;
			var options = {
				host: 'api.nzpost.co.nz/privateaddresschecker/1.0',
				path: query,
				headers: {
					'accept': 'application/json'
				}
			}
	
			const https = require('https');

			https.get(options, (resp: any) => {
				let data = '';
				
				// A chunk of data has been recieved.
				resp.on('data', (chunk: any) => {
				  data += chunk;
				});
			  
				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					var response = JSON.parse(data);
					console.log("setAddress API response")
		
					if (response.success){
						console.log(response);
						this.inputElement.value = response.details[response.details.length -1].AddressLine1
						// @ts-ignore
						Xrm.Page.getAttribute(context.parameters.address_street.attributes.LogicalName).setValue(response.details[response.details.length -1].AddressLine1);
						// @ts-ignore
						Xrm.Page.getAttribute(context.parameters.address_building.attributes.LogicalName).setValue(response.details[response.details.length -1].AddressLine5);
						// @ts-ignore
						Xrm.Page.getAttribute(context.parameters.address_suburb.attributes.LogicalName).setValue(response.details[response.details.length -1].Suburb);
						// @ts-ignore
						Xrm.Page.getAttribute(context.parameters.address_postcode.attributes.LogicalName).setValue(response.details[response.details.length -1].Postcode);
						// @ts-ignore
						Xrm.Page.getAttribute(context.parameters.address_city.attributes.LogicalName).setValue(response.details[response.details.length -1].CityTown);
						// @ts-ignore
						Xrm.Page.getAttribute(context.parameters.address_country.attributes.LogicalName).setValue("New Zealand");
						// @ts-ignore
						if (context.parameters.address_longitude.attributes.LogicalName.raw != undefined)
						{
							// @ts-ignore
							Xrm.Page.getAttribute(context.parameters.address_longitude.attributes.LogicalName).setValue(response.details[response.details.length -1].NZGD2kCoord.coordinates[0]);				
						}
						// @ts-ignore
						if (context.parameters.address_latitude.attributes.LogicalName.raw != undefined)
						{
							// @ts-ignore
							Xrm.Page.getAttribute(context.parameters.address_latitude.attributes.LogicalName).setValue(response.details[response.details.length -1].NZGD2kCoord.coordinates[1]);				
						}
						// @ts-ignore
						if (context.parameters.address_dpid.attributes.LogicalName.raw != undefined)
						{
							// @ts-ignore
							Xrm.Page.getAttribute(context.parameters.address_dpid.attributes.LogicalName).setValue(response.details[response.details.length -1].DPID);				
						}					
					}
				});

			}).on("error", (err: { message: string; }) => {
				console.log("Error: " + err.message);
			});		
		}
		else {
			console.log("setSelected :: No " + key);
		}		
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{	
		console.log("getOutput");
		this.updateView(this.context)
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
		//this.inputElement.removeEventListener("input", this._refreshData);
	}
}