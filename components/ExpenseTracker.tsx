
import React, { useState } from 'react';
import { Expense } from '../types';
import { WalletIcon } from './icons/WalletIcon';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  fuelCost: number;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ expenses, onAddExpense, fuelCost }) => {
  const [category, setCategory] = useState<Expense['category']>('Pedágio');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onAddExpense({
      category,
      amount: parseFloat(amount),
      description,
      timestamp: new Date().toISOString(),
    });

    setAmount('');
    setDescription('');
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const grandTotal = totalExpenses + fuelCost;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-900/50 p-2 rounded-full">
             <WalletIcon className="text-blue-400 w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Controle de Despesas</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-yellow-500">
           <p className="text-xs text-gray-400">Combustível</p>
           <p className="text-xl font-bold text-white">R$ {fuelCost.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-green-500">
           <p className="text-xs text-gray-400">Outras Despesas</p>
           <p className="text-xl font-bold text-white">R$ {totalExpenses.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="bg-gray-700/30 p-4 rounded-lg mb-6 text-center">
         <p className="text-sm text-gray-300">Custo Total da Viagem</p>
         <p className="text-3xl font-bold text-white">R$ {grandTotal.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg space-y-4 mb-6">
        <h4 className="font-medium text-white">Adicionar Nova Despesa</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label className="block text-xs text-gray-300 mb-1">Categoria</label>
                <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
                >
                <option value="Pedágio">Pedágio</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Hospedagem">Hospedagem</option>
                <option value="Outros">Outros</option>
                </select>
            </div>
            <div>
                <label className="block text-xs text-gray-300 mb-1">Valor (R$)</label>
                <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
                required
                />
            </div>
        </div>
        <div>
            <label className="block text-xs text-gray-300 mb-1">Descrição (Opcional)</label>
            <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Praça de pedágio km 200"
            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white"
            />
        </div>
        <button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors">
            Adicionar Despesa
        </button>
      </form>

      <div className="space-y-2 max-h-60 overflow-y-auto">
          {expenses.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">Nenhuma despesa registrada.</p>
          ) : (
              expenses.slice().reverse().map(exp => (
                  <div key={exp.id} className="flex justify-between items-center bg-gray-900/30 p-3 rounded border border-gray-700">
                      <div>
                          <p className="font-medium text-white">{exp.category}</p>
                          <p className="text-xs text-gray-400">{exp.description} • {new Date(exp.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <span className="font-bold text-white">R$ {exp.amount.toFixed(2)}</span>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default ExpenseTracker;
