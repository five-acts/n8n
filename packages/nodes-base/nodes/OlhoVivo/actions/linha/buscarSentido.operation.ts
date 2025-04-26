import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';

import { olhoVivoApiRequest, processarLinhaResponse } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Código Da Linha',
		name: 'codigoLinha',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['linha'],
				operation: ['buscarSentido'],
			},
		},
		description: 'Código numérico identificador da linha de ônibus (ex: 1273, 34041)',
		placeholder: '1273',
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	const codigoLinha = this.getNodeParameter('codigoLinha', i) as string;
	const returnData: IDataObject[] = [];

	// Fazer a requisição para buscar linhas por sentido
	const endpoint = `/Linha/BuscarLinhaSentido?codigoLinha=${encodeURIComponent(codigoLinha)}`;
	const linhas = await olhoVivoApiRequest.call(this, 'GET', endpoint);

	// Processar resposta
	if (Array.isArray(linhas)) {
		for (const linha of linhas) {
			returnData.push(processarLinhaResponse(linha));
		}
	}

	return returnData;
}
