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
}
}

export default DBService;