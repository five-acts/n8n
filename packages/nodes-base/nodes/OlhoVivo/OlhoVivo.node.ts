import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import * as linha from './actions/linha';
import * as parada from './actions/parada';
import * as previsao from './actions/previsao';

export class OlhoVivo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SPTrans Olho Vivo',
		name: 'olhoVivo',
		icon: 'file:olhovivo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Consultar dados do sistema de transporte público da cidade de São Paulo através da API Olho Vivo da SPTrans',
		defaults: {
			name: 'Olho Vivo',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'OlhoVivoApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Recurso',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Linha',
						value: 'linha',
						description: 'Consultar informacoes sobre linhas de onibus',
					},
					{
						name: 'Parada',
						value: 'parada',
						description: 'Consultar informacoes sobre paradas de onibus',
					},
					{
						name: 'Previsao',
						value: 'previsao',
						description: 'Consultar previsoes de chegada de onibus',
					},
				],
				default: 'linha',
			},
			...linha.linhaOperations,
			...linha.description,
			...parada.paradaOperations,
			...parada.description,
			...previsao.previsaoOperations,
			...previsao.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		console.log(`Executando OlhoVivo node com resource=${resource}, operation=${operation}`);

		// Função auxiliar para mapear campos com underscores para os nomes esperados pelo código
		function mapearCamposComUnderscore(itemData: IDataObject): void {
			// Mapeamentos de nomes de campos com underscores para os nomes esperados
			const mapeamentos: { [key: string]: string } = {
				C_digo_da_Parada: 'codigoParada',
				C_digo_da_Linha: 'codigoLinha',
				C_digo_do_Corredor: 'codigoCorredor',
				Termos_Busca: 'termosBusca',
			};

			// Para cada mapeamento, verifique se o campo com underscore existe
			for (const [campoComUnderscore, campoEsperado] of Object.entries(mapeamentos)) {
				if (campoComUnderscore in itemData && !(campoEsperado in itemData)) {
					console.log(`Mapeando campo ${campoComUnderscore} para ${campoEsperado}`);
					itemData[campoEsperado] = itemData[campoComUnderscore];
				}
			}
		}

		for (let i = 0; i < items.length; i++) {
			try {
				// Log dos parâmetros de entrada
				console.log(`Processando item ${i}:`, JSON.stringify(items[i].json));

				// Mapear campos com underscores para os nomes esperados pelo código
				// Isso permite que os usuários usem C_digo_da_Parada e C_digo_da_Linha (com underscores)
				mapearCamposComUnderscore(items[i].json);

				if (resource === 'linha') {
					if (operation === 'buscar') {
						console.log('Executando operação: buscar linha');
						const result = await linha.execute.buscar.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					} else if (operation === 'buscarSentido') {
						console.log('Executando operação: buscarSentido linha');
						const result = await linha.execute.buscarSentido.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					}
				} else if (resource === 'parada') {
					if (operation === 'buscar') {
						console.log('Executando operação: buscar parada');
						const result = await parada.execute.buscar.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					} else if (operation === 'buscarPorLinha') {
						console.log('Executando operação: buscar parada por linha');
						const result = await parada.execute.buscarPorLinha.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					} else if (operation === 'buscarPorCorredor') {
						console.log('Executando operação: buscar parada por corredor');
						const result = await parada.execute.buscarPorCorredor.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					}
				} else if (resource === 'previsao') {
					if (operation === 'parada') {
						console.log('Executando operação: previsão por parada');
						const result = await previsao.execute.parada.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					} else if (operation === 'linha') {
						console.log('Executando operação: previsão por linha');
						const result = await previsao.execute.linha.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					} else if (operation === 'linhaParada') {
						console.log('Executando operação: previsão por linha e parada');
						// Verificar os parâmetros antes da execução
						const codigoParada = this.getNodeParameter('codigoParada', i, '') as string;
						const codigoLinha = this.getNodeParameter('codigoLinha', i, '') as string;
						console.log(`Parâmetros: codigoParada=${codigoParada}, codigoLinha=${codigoLinha}`);

						const result = await previsao.execute.linhaParada.call(this, i);
						console.log(`Resultado (${result.length} itens):`, JSON.stringify(result.slice(0, 2)));
						returnData.push(...result);
					}
				}
			} catch (error) {
				console.error('Erro na execução:', error.message);

				if (this.continueOnFail()) {
					returnData.push({
						erro: error.message,
						detalhes: error.stack,
						recurso: resource,
						operacao: operation,
						indice_item: i,
						dados_item: items[i].json,
					});
					continue;
				}
				throw error;
			}
		}

		console.log(`Execução finalizada. Total de itens: ${returnData.length}`);
		return [this.helpers.returnJsonArray(returnData)];
	}
}
