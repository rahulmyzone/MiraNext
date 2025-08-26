import pool from "./DBConnection.js";
import appconfig from '../../app/app-config.js';

const DBService = { 
    findDataFromDB(entity, dbtablename) {
        let select = `Select * from ${appconfig.mira_schema_name}.${dbtablename} `;
        //select = `${select} where candle_date_time = '${date}' and candle = '${candle}' and `;
        let whereClause;
        let keys = Object.keys(entity);
        if(keys.length > 0) {
            whereClause = ` where `
        }
        keys.forEach(function(key) {
            var val = entity[key];
            if(val != null && val != 'null') {
                if(typeof(val) == 'number') {
                    whereClause = ` ${whereClause} ${key} = ${val} and `;
                } else {
                    whereClause = ` ${whereClause} ${key} = '${val}' and `;
                }
            }
        });
        if(whereClause != undefined && whereClause.length > 0) {
            whereClause = whereClause.substring(0, whereClause.length - 4);
        }
        select = `${select} ${whereClause}`;
        return new Promise((resolve, reject) => {
            pool.query(select, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve({stat: "Ok", Items: result.rows, count: result.rows.length});
                }
            });
        });
    },
    

    createDataInDB(entity, tablename){
        if(entity.id != undefined) {
            return updateEntity(entity, tablename);
        }
        else {
            return saveInsertEntity(entity, tablename);
        }
    },

    exportTableStructure(tableName) {
        const query = `
            SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `;
        try {
            return new Promise((resolve, reject) => {
                pool.query(query, [tableName], (err, result) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve({stat: "Ok", Items: result.rows, count: result.rows.length});
                    }
                });
            });
        } catch (err) {
            return { stat: "Error", error: err.message };
        }
    },

    createTableFromStructure: async function(tableName, columns) {
        // columns: array of objects with column_name, data_type, is_nullable, column_default
        let columnDefs = columns.map(col => {
            let def = `${col.column_name} ${col.data_type}`;
            if (col.is_nullable === 'NO') def += ' NOT NULL';
            if (col.column_default) def += ` DEFAULT ${col.column_default}`;
            return def;
        }).join(',\n  ');

        const query = `
            CREATE TABLE IF NOT EXISTS ${appconfig.mira_schema_name}.${tableName} (
              ${columnDefs}
            );
        `;
        try {
            await pool.query(query);
            return { stat: "Ok", message: `Table ${tableName} created.` };
        } catch (err) {
            return { stat: "Error", error: err.message };
        }
    }
    
}

function updateEntity(entity, tablename) {
        let query = `update ${mira_schema_name}.${tablename} `;
        let updateKeys = ' set ';
        Object.keys(entity).forEach(function(key) {
            var val = entity[key];
            if(val != null && val != 'null') {
                updateKeys = `${updateKeys} ${key} = '${val}', `;
            }
        });
        updateKeys = updateKeys.substring(0, updateKeys.length-2);
        query = `${query} ${updateKeys} where id = ${entity.id} RETURNING *`;

        return new Promise((resolve, reject) => {
            client.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve({stat: "Ok", Items: result.rows, count: result.rows.length});
                }
            });
        });
    }

    function saveInsertEntity (entity, tablename) {
        let query = `insert into ${mira_schema_name}.${tablename} ( `;
        let insertKeys = '';
        let insertVal = '';
        Object.keys(entity).forEach(function(key) {
            var val = entity[key];
            if(val != null && val != 'null') {
                insertKeys = `${insertKeys}, ${key}`;
                if(key.toLowerCase() == 'timestamp') {
                    val = utils.dateFormat(new Date(val));
                    insertVal = `${insertVal}, '${val}'`;
                } else if(typeof(val) == 'number') {
                    insertVal = `${insertVal}, ${val}`;
                } else {
                    insertVal = `${insertVal}, '${val}'`;
                }
                
            }
        });
        insertKeys = insertKeys.substring(1, insertKeys.length);
        insertVal = insertVal.substring(1, insertVal.length);
        query = `${query} ${insertKeys} ) values (${insertVal}) RETURNING *`;

        return new Promise((resolve, reject) => {
            client.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve({stat: "Ok", Items: result.rows, count: result.rows.length});
                }
            });
        });
    }

export default DBService;