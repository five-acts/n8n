import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { olhoVivoApiRequest, processarLinhaResponse } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Termos De Busca',
		name: 'termosBusca',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['linha'],
				operation: ['buscar'],
			},
		},
		description: 'Nome ou número da linha a ser procurada',
		placeholder: '8000',
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	const termosBusca = this.getNodeParameter('termosBusca', i) as string;
	const returnData: IDataObject[] = [];

	// Fazer a requisição para buscar linhas
	const endpoint = `/Linha/Buscar?termosBusca=${encodeURIComponent(termosBusca)}`;
	const linhas = await olhoVivoApiRequest.call(this, 'GET', endpoint);

	// Processar resposta
	if (Array.isArray(linhas)) {
		for (const linha of linhas) {
			returnData.push(processarLinhaResponse(linha));
		}
	}

	return returnData;
}
