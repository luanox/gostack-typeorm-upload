import {getCustomRepository, getRepository} from 'typeorm'

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category'
import TransactionRepository from '../repositories/TransactionsRepository'

interface Request {
  title: string
  value: number
  type: 'income' | 'outcome'
  category: string
}

class CreateTransactionService {
  public async execute({title, value, type, category}: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository)
    const categoryRepository = getRepository(Category)
    const {total} = await transactionRepository.getBalance()
    
    if (type !== 'outcome' && type !== 'income') {
      throw new AppError("Invalid transaction!", 400)
    }

    if (type == 'outcome' && value > total || type == 'outcome' && total == 0){
      throw new AppError("you have no balance to do this operation!")
    }

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category
      }
    })

    if(!transactionCategory){

      const categories = categoryRepository.create({
        title: category
      })
      
      transactionCategory = await categoryRepository.save(categories)

    }
    
    const tansaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: transactionCategory?.id
    })

    await transactionRepository.save(tansaction)

    return tansaction
  }
}

export default CreateTransactionService;
