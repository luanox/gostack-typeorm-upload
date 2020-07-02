import { Router } from 'express';
import {getCustomRepository} from 'typeorm'
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import uploadConfig from '../config/upload'

const transactionsRouter = Router();
const upload = multer(uploadConfig)

transactionsRouter.get('/', async (request, response) => {
  const transationsRepository = getCustomRepository(TransactionsRepository)
  const transactions = await transationsRepository.find()
  const balance = await transationsRepository.getBalance()
  
  return response.json({
    transactions,
    balance
  })
});

transactionsRouter.post('/', async (request, response) => {
  const {title, value, type, category} = request.body

  const createTransaction = new CreateTransactionService()

  const trasaction = await createTransaction.execute({
    title, 
    value, 
    type, 
    category
  })
  
  return response.json(trasaction)
});

transactionsRouter.delete('/:id', async (request, response) => {
  const {id} = request.params

  const deleteTransaction = new DeleteTransactionService()

  await deleteTransaction.execute(id)
  
  return response.status(204).send();
});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const importTransactions = new ImportTransactionsService()
  const transationsRepository = getCustomRepository(TransactionsRepository)


  const transactions = await importTransactions.execute(request.file.path)
  const balance = await transationsRepository.getBalance()

  return response.json({
    transactions,
    balance
  });
  
});

export default transactionsRouter;
