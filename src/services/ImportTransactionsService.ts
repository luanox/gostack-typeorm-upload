import {getCustomRepository, getRepository, In} from 'typeorm'
import csvParse from 'csv-parse'
import fs from 'fs'

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category'
import TransactionRepository from '../repositories/TransactionsRepository'

interface CSVTransaction {
    title: string;
    type: 'income' | 'outcome';
    value: number;
    category: string;
}

class ImportTransactionsService {
    async execute(filepath: string): Promise<Transaction[]> {
        // const contactReadStream = fs.createReadStream(filepath) // Esta linha abre o arquivo como um fluxo legível

        const parsers = csvParse({
            from_line: 2
        })
        // const parseToCSV = contactReadStream.pipe(parsers)

        const transactions: CSVTransaction[] = [];
        const categories: string[] = [];

        const parseToCSV = fs.createReadStream(filepath)
            .pipe(parsers)
            .on('data', async line => {
                const [title, type, value, category] = line.map((cell: string) =>
                cell.trim(),
                );

                if (!title || !type || !value) return;
                categories.push(category);

                transactions.push({
                    title,
                    type,
                    value,
                    category,
                })
            })
        
        await new Promise(resolve => parseToCSV.on('end', resolve));

        const transactionsRepository = getCustomRepository(TransactionRepository)
        const categoriesRepository = getRepository(Category)

        const existCategories = await categoriesRepository.find({
            where: {
                title: In(categories),
            },
        });
        
        const categoriesTitles = existCategories.map(
            (category: Category) => category.title,
        );
        
          /* Filtrando filtros existentes e repetidos */
        const addCategoryTitles = categories
            .filter(category => !categoriesTitles.includes(category))
            .filter((value, index, self) => index === self.indexOf(value));

        const addcategories = categoriesRepository.create(
            addCategoryTitles.map((title => ({
                title
            })))
        )
        
        await categoriesRepository.save(addcategories)
        
        const allCategories = [...addcategories, ...existCategories]
        
        const tansaction = await transactionsRepository.create(
            transactions.map(transaction => ({
                title: transaction.title,
                value: transaction.value,
                type: transaction.type,
                category: allCategories.find(
                    category => category.title === transaction.category,
                ),
            }))
        )

        await transactionsRepository.save(tansaction);
        
        // await fs.promises.unlink(filepath);
        console.log(tansaction);
        
        return tansaction;
    }
}

export default ImportTransactionsService;