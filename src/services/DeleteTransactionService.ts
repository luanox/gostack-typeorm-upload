import {getCustomRepository, getRepository} from 'typeorm'

import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository'


class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionRepository)

    const transactionExist = await transactionRepository.findOne({
      where: {id: id}
    })

    if (!transactionExist) {
      throw new AppError("Transaction not Exist!", 400)
    }
    
    await transactionRepository.delete({id: id})

    return
  }
}

export default DeleteTransactionService;
