"use client";
import { useState } from "react";

interface Transaction {
	type: "income" | "expense";
	category: string;
	amount: number;
	description: string;
	id: string;
}

export default function Home() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [type, setType] = useState("expense");
	const [category, setCategory] = useState("");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");

	const addTransaction = () => {
		const newTransaction: Transaction = {
			type: type as "income" | "expense",
			category,
			amount: parseFloat(amount),
			description,
			id: Date.now().toString(),
		};
		setType("expense");
		setCategory("");
		setAmount("");
		setDescription("");
		setTransactions([...transactions, newTransaction]);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="bg-white p-8 rounded shadow-md w-full max-w-md">
				<h1 className="text-2xl text-gray-700 font-bold mb-6 text-center">
					Entradas Financeiras
				</h1>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="type"
							className="block text-sm font-medium text-gray-700"
						>
							Tipo
						</label>
						<select
							id="type"
							value={type}
							onChange={(e) => setType(e.target.value)}
							className="mt-1 block w-full text-gray-700 p-2 border border-gray-300 rounded-md"
						>
							<option value="expense">Gasto</option>
							<option value="income">Ganho</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="category"
							className="block text-sm font-medium text-gray-700"
						>
							Categoria
						</label>
						<input
							type="text"
							id="category"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-700"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="amount"
							className="block text-sm font-medium text-gray-700"
						>
							Quantia
						</label>
						<input
							type="number"
							id="amount"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-700"
							required
						/>
					</div>
					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700"
						>
							Descrição
						</label>
						<input
							type="text"
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-700"
						/>
					</div>
					<button
						onClick={addTransaction}
						className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
					>
						Adicionar
					</button>
				</div>
				<div className="mt-6">
					<h2 className="text-xl text-gray-700 font-bold mb-4">
						Transações
					</h2>
					<ul>
						{transactions.map((transaction) => (
							<li key={transaction.id} className="mb-2">
								<div
									className={`p-4 rounded text-gray-700 ${
										transaction.type === "income"
											? "bg-green-100"
											: "bg-red-100"
									}`}
								>
									<p>
										<strong>Tipo:</strong>{" "}
										{transaction.type === "income"
											? "Ganho"
											: "Gasto"}
									</p>
									<p>
										<strong>Categoria:</strong>{" "}
										{transaction.category}
									</p>
									<p>
										<strong>Quantia:</strong> $
										{transaction.amount.toFixed(2)}
									</p>
									<p>
										<strong>Descrição:</strong>{" "}
										{transaction.description}
									</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
