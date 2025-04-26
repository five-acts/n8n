import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';

import { olhoVivoApiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Codigo da Parada',
		name: 'codigoParada',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['previsao'],
				operation: ['parada'],
			},
		},
		description: 'Codigo identificador da parada de onibus',
		placeholder: '4200953',
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	const codigoParada = this.getNodeParameter('codigoParada', i) as string;

	// Fazer a requisição para obter a previsão de chegada para a parada
	const endpoint = `/Previsao/Parada?codigoParada=${encodeURIComponent(codigoParada)}`;
	const response = await olhoVivoApiRequest.call(this, 'GET', endpoint);

	// Processar os dados de resposta
	const returnData: IDataObject[] = [];

	// Verificar a estrutura completa da resposta para diagnóstico
	if (!response) {
		// Adiciona um item informando que a resposta foi vazia
		returnData.push({
			erro: 'Resposta vazia da API',
			codigo_parada: codigoParada,
		});
		return returnData;
	}

	// Se temos uma resposta, mas não temos o campo p, retornamos a resposta bruta para diagnóstico
	if (!response.p) {
		returnData.push({
			resposta_api: response,
			codigo_parada_usado: codigoParada,
		});
		return returnData;
	}

	const parada = response.p;

	// Dados básicos da parada
	const paradaInfo: IDataObject = {
		codigo_parada: parada.cp,
		nome_parada: parada.np,
		endereco: parada.ed,
		latitude: parada.py,
		longitude: parada.px,
		hora_atualizacao: response.hr,
	};

	// Processar as linhas e previsões
	if (Array.isArray(parada.l)) {
		for (const linha of parada.l) {
			const linhaInfo: IDataObject = {
				...paradaInfo,
				codigo_linha: linha.cl,
				letreiro_codigo: linha.c,
				sentido: linha.sl,
				letreiro_origem: linha.lt0,
				letreiro_destino: linha.lt1,
				qtd_veiculos: linha.qv,
			};

			// Adicionar veículos com previsão
			if (Array.isArray(linha.vs)) {
				for (const veiculo of linha.vs) {
					returnData.push({
						...linhaInfo,
						prefixo_veiculo: veiculo.p,
						acessivel: veiculo.a === true,
						previsao_chegada: veiculo.t,
						latitude_veiculo: veiculo.py,
						longitude_veiculo: veiculo.px,
					});
				}
			} else {
				// Se não há veículos previstos, retorna apenas as informações da linha
				returnData.push({
					...linhaInfo,
					sem_previsao: true,
				});
			}
		}
	} else if (parada.l) {
		// Em alguns casos, l pode não ser um array
		returnData.push({
			...paradaInfo,
			dados_linha: parada.l,
			observacao: 'Estrutura de linha não reconhecida',
		});
	} else {
		// Não há linhas na resposta
		returnData.push({
			...paradaInfo,
			sem_linhas: true,
		});
	}

	return returnData;
}

// Função auxiliar para mapear o tipo de veículo
function getTipoVeiculo(tipo: number): string {
	switch (tipo) {
		case 1:
			return 'Microônibus';
		case 2:
			return 'Miniônibus';
		case 3:
			return 'Ônibus Básico';
		case 4:
			return 'Ônibus Padron';
		case 5:
			return 'Ônibus Articulado';
		case 6:
			return 'Ônibus Biarticulado';
		default:
			return 'Não identificado';
	}
}
