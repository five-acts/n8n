import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';

import { olhoVivoApiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Termos De Busca',
		name: 'termosBusca',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['parada'],
				operation: ['buscar'],
			},
		},
		description: 'Termos para buscar paradas por nome ou endereço',
		placeholder: 'Av. Paulista',
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	const termosBusca = this.getNodeParameter('termosBusca', i) as string;

	// Fazer a requisição para buscar paradas
	const endpoint = `/Parada/Buscar?termosBusca=${encodeURIComponent(termosBusca)}`;
	const response = await olhoVivoApiRequest.call(this, 'GET', endpoint);

	// Processar os dados de resposta
	const returnData: IDataObject[] = [];

	// Verificar a estrutura completa da resposta para diagnóstico
	if (!response) {
		// Adiciona um item informando que a resposta foi vazia
		returnData.push({
			erro: 'Resposta vazia da API',
			termos_busca: termosBusca,
		});
		return returnData;
	}

	// Se temos uma resposta, mas não é um array, retornamos a resposta bruta para diagnóstico
	if (!Array.isArray(response)) {
		returnData.push({
			resposta_api: response,
			termos_busca_usado: termosBusca,
		});
		return returnData;
	}

	// Processar cada parada retornada
	for (const parada of response) {
		returnData.push({
			codigo_parada: parada.cp,
			nome_parada: parada.np,
			endereco: parada.ed,
			latitude: parada.py,
			longitude: parada.px,
		});
	}

	return returnData;
}
