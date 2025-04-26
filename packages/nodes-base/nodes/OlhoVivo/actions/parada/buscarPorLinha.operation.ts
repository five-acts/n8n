import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';

import { olhoVivoApiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Código Da Linha',
		name: 'codigoLinha',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['parada'],
				operation: ['buscarPorLinha'],
			},
		},
		description: 'Código identificador da linha de ônibus',
		placeholder: '1989',
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	const codigoLinha = this.getNodeParameter('codigoLinha', i) as string;

	// Fazer a requisição para buscar paradas que são atendidas pela linha
	const endpoint = `/Parada/BuscarParadasPorLinha?codigoLinha=${encodeURIComponent(codigoLinha)}`;
	const response = await olhoVivoApiRequest.call(this, 'GET', endpoint);

	// Processar os dados de resposta
	const returnData: IDataObject[] = [];

	// Verificar a estrutura completa da resposta para diagnóstico
	if (!response) {
		// Adiciona um item informando que a resposta foi vazia
		returnData.push({
			erro: 'Resposta vazia da API',
			codigo_linha: codigoLinha,
		});
		return returnData;
	}

	// Se temos uma resposta, mas não é um array, retornamos a resposta bruta para diagnóstico
	if (!Array.isArray(response)) {
		returnData.push({
			resposta_api: response,
			codigo_linha_usado: codigoLinha,
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
