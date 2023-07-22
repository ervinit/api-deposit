var async = require("async");
const moment = require('moment');
const sql = require("../models/db");
const { Web3 } = require('web3');
const ERC20 = require('../contracts/ERC20.json');

const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
const web3 = new Web3(provider);

const userBalance = async (id, result) => {
    sql.query(`SELECT balance FROM users WHERE id = ${id}`, (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        }
        console.log("balance: ", res[0]['balance']);
        return res[0]['balance'];
    });
}

const totalDeposit = async (id, result) => {
    sql.query(`SELECT SUM(amount) AS total_deposits FROM deposits WHERE user_id = ${id}`, (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        }
        console.log("total_deposits: ", res[0]['total_deposits']);
        return res[0]['total_deposits'];
    });
}

const totalWithdraw = async (id, result) => {
    sql.query(`SELECT SUM(amount) AS total_withdrawals FROM withdrawals WHERE user_id = ${id}`, (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        }
        console.log("total_withdrawals: ", res[0]['total_withdrawals']);
        return res[0]['total_withdrawals'];
    });
}

const totalWin = async (id, result) => {
    sql.query(`SELECT SUM(amount) AS total_win FROM transactions WHERE user_id = ${id} AND trx_type='+'`, (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        }
        console.log("total_win: ", res[0]['total_win']);
        return res[0]['total_win'];
    });
}

const totalLoss = async (id, result) => {
    sql.query(`SELECT SUM(amount) AS total_loss FROM transactions WHERE user_id = ${id} AND trx_type='-'`, (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        }
        console.log("total_loss: ", res[0]['total_loss']);
        return res[0]['total_loss'];
    });
}

exports.dashboard = async (req, res) => {
    const user_id = req.user.sub;

    sql.getConnection((error, connection) => {
        if (error) {
          throw error;
        }
        
        connection.query(`SELECT balance FROM users WHERE id = ${user_id}`, (error, balance) => {
            if (error) {
                throw error;
            }
            connection.release();

            sql.getConnection((error, conn) => {
                if (error) {
                    throw error;
                }
                conn.query(`SELECT SUM(amount) AS total_deposits FROM deposits WHERE user_id = ${user_id}`, (error, total_deposits) => {
                    conn.release();

                    sql.getConnection((error, conn) => {
                        if (error) {
                            throw error;
                        }
                        conn.query(`SELECT SUM(amount) AS total_withdrawals FROM withdrawals WHERE user_id = ${user_id}`, (error, total_withdrawals) => {
                            conn.release();

                            sql.getConnection((error, conn) => {
                                if (error) {
                                    throw error;
                                }
                                conn.query(`SELECT SUM(amount) AS total_win FROM transactions WHERE user_id = ${user_id} AND trx_type='+'`, (error, total_win) => {
                                    conn.release();

                                    sql.getConnection((error, conn) => {
                                        if (error) {
                                            throw error;
                                        }
                                        conn.query(`SELECT SUM(amount) AS total_loss FROM transactions WHERE user_id = ${user_id} AND trx_type='-'`, (error, total_loss) => {
                                            conn.release();

                                            let data = {
                                                balance: balance[0]['balance'],
                                                total_deposits: total_deposits[0]['total_deposits'],
                                                total_withdrawals: total_withdrawals[0]['total_withdrawals'],
                                                total_win: total_win[0]['total_win'],
                                                total_loss: total_loss[0]['total_loss']
                                            };
                                            
                                            res.send({success: true, data});
                                        });
                                    });
        
                                });
                            });

                        });
                    });
                })
            });

        });
    });
}

exports.trxHash = async (req, res) => {
    const {hash, amount, address} = req.body;

    const now = new Date();
    const formattedDatetime = moment(now).format('YYYY-MM-DD HH:mm:ss');
    
    sql.query(`INSERT INTO deposits ( user_id, amount, method_currency, trx, status, btc_wallet, created_at, updated_at ) VALUES (${req.user.sub}, ${amount}, 'KFC', '${hash}', 2, '${address}', '${formattedDatetime}', '${formattedDatetime}')`, (err, result) => {
        if (err) {
            console.log(err);
            res.send({status: false, hash});
            return;
        }
    
        console.log(result);

        res.send({status: true, hash: hash, id: result.insertId});
    });
}

exports.trxList = async (req, res) => {
    sql.getConnection((error, connection) => {
        if (error) {
          throw error;
        }
        
        connection.query(`SELECT id, amount, trx, status, created_at FROM deposits WHERE user_id = '${req.user.sub}' ORDER BY created_at DESC LIMIT 25;`, (error, deposits) => {
            if (error) {
                throw error;
            }
            connection.release();

            sql.getConnection((error, conn) => {
                if (error) {
                    throw error;
                }
                conn.query(`SELECT id, amount, trx, gasfee, status, created_at FROM withdrawals WHERE user_id = '${req.user.sub}' ORDER BY created_at DESC LIMIT 25;`, (error, withdrawals) => {
                    conn.release();

                    sql.getConnection((error, conn) => {
                        if (error) {
                            throw error;
                        }
                        conn.query(`SELECT balance FROM users WHERE id=${req.user.sub}`, (error, balance) => {
                            conn.release();

                            sql.getConnection((error, conn) => {
                                if (error) {
                                    throw error;
                                }
                                conn.query(`SELECT SUM(amount) AS total_deposits FROM deposits WHERE user_id = ${req.user.sub}`, (error, total_deposits) => {
                                    conn.release();
                
                                    sql.getConnection((error, conn) => {
                                        if (error) {
                                            throw error;
                                        }
                                        conn.query(`SELECT SUM(amount) AS total_withdrawals FROM withdrawals WHERE user_id = ${req.user.sub}`, (error, total_withdrawals) => {
                                            conn.release();
            

                                            if (balance.length) {
                                                res.status(200).json({
                                                    status : true,
                                                    deposits,
                                                    withdrawals,
                                                    balance: balance[0].balance,
                                                    total_deposits:total_deposits[0].total_deposits,
                                                    total_withdrawals: total_withdrawals[0].total_withdrawals
                                                });
                                            }
                                        });

                                    });
                                });
                            });
                        });                
                    });
                });
            });
        });
    });
}

exports.withdraw = async (req, res) => {
    const user_id = req.user.sub;
    const { wallet, amount } = req.body;

    sql.getConnection((error, connection) => {
        if (error) {
          throw error;
        }
        
        console.log(user_id, wallet);
        connection.query(`SELECT id, balance FROM users WHERE id = '${user_id}'`, async (error, user) => {
            if (error) {
                throw error;
            }
            connection.release();
            if(user[0].balance > amount) {
                const tokenAddress = process.env.TOKEN_ADDRESS || '0x8699398d1037d92EC3Df27a75037A88cF9Fd9f0f';
                const tokenContract = new web3.eth.Contract(ERC20, tokenAddress);

                const senderAddress = process.env.SENDER_ADDRESS || '0x399A368e0825E4b6d62c5bE8221b754400995913';
                const senderPrivateKey = process.env.SENDER_PRIVATEKEY || 'd8950f81b3683702b9872fdee6642fcd1f7aa863a67b79460ca8c2fbfc811207';

                const recipientAddress = wallet;
                const trx_amount = web3.utils.toWei(amount, 'ether'); // Amount to transfer

                const transferData = tokenContract.methods.transfer(recipientAddress, trx_amount).encodeABI();

                const gasPrice = await web3.eth.getGasPrice();
                const gasLimit = 1000000; // Adjust the gas limit as needed

                const transactionObject = {
                    from: senderAddress,
                    to: tokenAddress,
                    gasPrice: gasPrice,
                    gas: gasLimit,
                    data: transferData,
                };

                const signedTransaction = await web3.eth.accounts.signTransaction(transactionObject, senderPrivateKey);
                console.log(signedTransaction);
                const gas = web3.utils.fromWei(gasPrice, 'gwei')

                sql.getConnection((error, conn) => {
                    if (error) {
                        throw error;
                    }
                    const now = new Date();
                    const formattedDatetime = moment(now).format('YYYY-MM-DD HH:mm:ss');

                    conn.query(`INSERT INTO withdrawals ( user_id, method_id, ref_by, amount, currency, trx, gasfee, status, account_wallet, created_at, updated_at ) VALUES (${user_id}, 1, 10, ${amount}, 'BNB', '${signedTransaction.transactionHash}', ${gas} , 2, '${wallet}', '${formattedDatetime}', '${formattedDatetime}')`, (error, result) => {
                        if (error) {
                            console.log(error)
                        }
                        conn.release();
                        
                        res.status(200).json({
                            status : true
                        });
                    });                
                });

                try {
                    await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
                } catch (error) {
                    console.error(error);
                }
            } else {
                res.status(200).json({
                    status : false,
                    message: 'Your balance is below requested amount.'
                });
            }
        });
    });
}

