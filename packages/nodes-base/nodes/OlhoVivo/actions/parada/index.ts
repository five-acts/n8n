import type { INodeProperties } from 'n8n-workflow';

import * as buscar from './buscar.operation';
import * as buscarPorLinha from './buscarPorLinha.operation';
import * as buscarPorCorredor from './buscarPorCorredor.operation';

export const paradaOperations: INodeProperties[] = [
	{
		displayName: 'Operação',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['parada'],
			},
		},
		options: [
			{
				name: 'Buscar',
				value: 'buscar',
				description: 'Buscar paradas por nome ou endereco',
				action: 'Buscar paradas por termo',
			},
			{
				name: 'Buscar Por Linha',
				value: 'buscarPorLinha',
				description: 'Buscar paradas que sao atendidas por uma linha especifica',
				action: 'Buscar paradas por linha',
			},
			{
				name: 'Buscar Por Corredor',
				value: 'buscarPorCorredor',
				description: 'Buscar paradas que pertencem a um corredor especifico',
				action: 'Buscar paradas por corredor',
			},
		],
		default: 'buscar',
	},
];

export const description = [
	...buscar.description,
	...buscarPorLinha.description,
	...buscarPorCorredor.description,
];

export const execute = {
	buscar: buscar.execute,
	buscarPorLinha: buscarPorLinha.execute,
	buscarPorCorredor: buscarPorCorredor.execute,
};
