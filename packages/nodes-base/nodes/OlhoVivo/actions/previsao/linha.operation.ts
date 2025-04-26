import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';

import { olhoVivoApiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Codigo da Linha',
		name: 'codigoLinha',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['previsao'],
				operation: ['linha'],
			},
		},
		description: 'Codigo identificador da linha de onibus',
		placeholder: '1989',
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	const codigoLinha = this.getNodeParameter('codigoLinha', i) as string;

	// Fazer a requisição para obter a previsão de chegada da linha em todas as paradas
	const endpoint = `/Previsao/Linha?codigoLinha=${encodeURIComponent(codigoLinha)}`;
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

	// Se temos uma resposta, mas não temos o campo ps, retornamos a resposta bruta para diagnóstico
	if (!response.ps || !Array.isArray(response.ps)) {
		returnData.push({
			resposta_api: response,
			codigo_linha_usado: codigoLinha,
		});
		return returnData;
	}

	// Hora da atualização
	const horaAtualizacao = response.hr;

	// Processar cada parada
	for (const parada of response.ps) {
		// Dados básicos da parada
		const paradaInfo: IDataObject = {
			codigo_parada: parada.cp,
			nome_parada: parada.np,
			latitude: parada.py,
			longitude: parada.px,
			hora_atualizacao: horaAtualizacao,
		};

		// Processar veículos com previsão
		if (Array.isArray(parada.vs)) {
			for (const veiculo of parada.vs) {
				returnData.push({
					...paradaInfo,
					prefixo_veiculo: veiculo.p,
					acessivel: veiculo.a === true,
					previsao_chegada: veiculo.t,
					latitude_veiculo: veiculo.py,
					longitude_veiculo: veiculo.px,
				});
			}
		} else {
			// Se não há veículos previstos, retorna apenas as informações da parada
			returnData.push({
				...paradaInfo,
				sem_previsao: true,
			});
		}
	}

	return returnData;
}
