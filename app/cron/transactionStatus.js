const {Web3} = require('web3');
const sql = require("../models/db");
// import Web3 from 'web3';

// Connect to BSC Testnet
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
const web3 = new Web3(provider);

const getDepositTransactionStatus = async (hash, amount, user_id) => {
  try {
    const receipt = await web3.eth.getTransactionReceipt(hash);
    if (receipt === null) {
      return `Transaction ${hash} is pending`;
    } else if (receipt.status) {
      sql.getConnection((error, connection) => {
        if (error) {
          throw error;
        }
        
        connection.query(`UPDATE deposits SET status=1 WHERE trx='${hash}'`, (error, datas) => {
          if (error) {
            throw error;
          }
          connection.release();

          sql.getConnection((error, conn) => {
            if (error) {
              throw error;
            }
            conn.query(`UPDATE users SET balance=balance+${amount} WHERE id=${user_id}`,
             (error, dt) => {
              conn.release();
            });                
          });
        });
      });
    } else {
      return `Transaction ${hash} failed`;
    }
  } catch (error) {
    return `Error retrieving receipt for transaction ${hash}: ${error}`;
  }
};

const getWithdrawTransactionStatus = async (hash, amount, user_id) => {
  try {
    const receipt = await web3.eth.getTransactionReceipt(hash);
    if (receipt === null) {
      return `Transaction ${hash} is pending`;
    } else if (receipt.status) {
      sql.getConnection((error, connection) => {
        if (error) {
          throw error;
        }
        
        connection.query(`UPDATE withdrawals SET status=1 WHERE trx='${hash}'`, (error, datas) => {
          if (error) {
            throw error;
          }
          connection.release();

          sql.getConnection((error, conn) => {
            if (error) {
              throw error;
            }
            conn.query(`UPDATE users SET balance=balance-${amount} WHERE id=${user_id}`,
             (error, dt) => {
              conn.release();
            });                
          });
        });
      });
    } else {
      return `Transaction ${hash} failed`;
    }
  } catch (error) {
    return `Error retrieving receipt for transaction ${hash}: ${error}`;
  }
};

exports.getTransactionHashList = async () => {
  sql.query(`SELECT id, trx, amount, user_id FROM deposits WHERE status = 2`, (err, results) => {
    if (results.length) {
      Promise.all(results.map((result) => getDepositTransactionStatus(result.trx, result.amount, result.user_id)))
        .then((statuses) => {
          console.log(statuses);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  });

  sql.query(`SELECT id, trx, amount, user_id FROM withdrawals WHERE status = 2`, (err, results) => {
    if (results.length) {
      Promise.all(results.map((result) => getWithdrawTransactionStatus(result.trx, result.amount, result.user_id)))
        .then((statuses) => {
          console.log(statuses);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  });
}