// * Standard Get Records: App, Query ?= Cursor query

// export function getRecords({ app, subDomain, token, query=null } = {}) {
//     return new Promise((resolve, reject) => {
//         const PARAMS = new URLSearchParams({ app })
//         if (query) PARAMS.set("query", query)
//         const URL = createKintoneUrl(subDomain, "/k/v1/records")

//         fetch(`${URL}?${PARAMS}`, {
//             method: "GET",
//             headers: {
//                 "X-Requested-With": "XMLHttpRequest",
//                 "X-Cybozu-API-Token": token
//             }
            
//         }).then(async response => {
//             if (response.ok) resolve(await response.json())
//             else resolve(response)
//         }).catch(err => {
//             console.log(err)
//             reject(err)
//         })
//     })
// }


/**
 * Represents a cursor for querying records in a Kintone app.
 * @class
 */
class Cursor {
    #app = null
    #subDomain = null
    #token = null
    #query = null

    #url = null
    
    /**
     * Create a new Cursor instance.
     * @constructor
     * @param {Object} options - The options for creating the Cursor.
     * @param {number} options.app - The ID of the Kintone app.
     * @param {string|null} [options.subDomain=null] - The subdomain of the Kintone domain.
     * @param {string|null} [options.token=null] - The Kintone API token.
     * @param {string|null} [options.query=null] - The query string for filtering records.
     */
    constructor({app, subDomain=null, token=null, query=null} = {}) {
        if (!app) console.warn("Missing app for cursor")
        this.#app = app
        this.#subDomain = subDomain
        this.#token = token
        this.#query = query


        this.#url = subDomain ?
            createKintoneUrl(subDomain, "/k/v1/records/cursor") :
            kintone.api.url('/k/v1/records/cursor', true)
    }

    /**
     * Add a cursor for querying records.
     * @returns {Promise} A Promise that resolves with the query results.
     */
    addCursor() {
        return new Promise((resolve, reject) => {
            let body = {
                "app": this.#app,
                "query": this.#query,
                "size": 500
            }

            if (this.#token) {
                fetch(this.#url, {
                    method: "POST",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "X-Cybozu-API-Token": this.#token
                    },
                    body
                
                }).then(async response => {
                    if (response.ok) resolve(await response.json())
                    else resolve(response)
                }).catch(err => {
                    console.log(err)
                    reject(err)
                })

            } else 
                kintone.api(kintone.api.url('/k/v1/records/cursor', true), 'POST', body, resolve, reject);   
        })
    }

    /**
     * Get records using a cursor.
     * @param {string} cursorID - The ID of the cursor.
     * @returns {Promise} A Promise that resolves with the query results.
     */
    getCursor(cursorID) {
    // Ideally cursorID should be a private variable
    // ! couldn't get access fetch response within getCursor
        return new Promise(async (resolve, reject) => {
            let body = {
                "id": cursorID
            }

            if (this.#token) {
                fetch(this.#url, {
                    method: "GET",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "X-Cybozu-API-Token": this.#token
                    },
                    body
                }).then(async response => {
                    if (response.ok) resolve(await response.json())
                    else resolve(response)
                }).catch(err => {
                    console.log(err)
                    reject(err)
                })

            } else 
                kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'GET', body, resolve, reject);
                // documentation says to include .json 

                // the return looks like:
                // {records: Array(2), next: false}
                // next:  false
                // records: Array(2)
                // 0 : {contact_name: {…}, notes: {…}, Last_user: {…}, telephone_number: {…}, Text: {…}, …}
                // 1 : {contact_name: {…}, notes: {…}, Last_user: {…}, telephone_number: {…}, Text: {…}, …}
                // length : 2
        })
    }

    /**
     * Delete a cursor.
     * @param {string} cursorID - The ID of the cursor to delete.
     * @returns {Promise} A Promise that resolves when the cursor is deleted.
     */
    deleteCursor(cursorID) {
    // ! When do we delete the cursor?
    // ! Should we delete the cursor?
        return new Promise(async (resolve, reject) => {

            // TODO : check if cursorID is valid/exists
            let body = {
                "id": cursorID
            }
            console.log("Deleting cursor with id:", cursorID)
            console.log(body)

            if (this.#token) {
                fetch(this.#url, {
                    method: "DELETE",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "X-Cybozu-API-Token": this.#token
                    },
                    body
                }).then(async response => {
                    if (response.ok) resolve(await response.json())
                    else resolve(response)
                }).catch(err => {
                    console.log(err)
                    reject(err)
                })

            } else 
                kintone.api(kintone.api.url('/k/v1/records/cursor.json', true), 'DELETE', body, resolve, reject);
        })
    }

    
    /**
     * Retrieve all records from a cursor using multiple requests.
     * @param {string} cursorID - The ID of the cursor to retrieve records from.
     * @returns {Promise<Array>} A Promise that resolves with an array of all records.
     */
    getAllRecords(cursorID) {
        const allRecords = [];
        let hasNextPage = true;
        let nextPageKey = null;

        while (hasNextPage) {
            const result = async getCursor(cursorID, nextPageKey);
            // TODO: fix this async/await

            // Add the records to the array
            if (result && result.records) {
                allRecords.push(...result.records);
            }

            // Check if there is a next page of records
            if (result && result.next) {
                hasNextPage = true;
                nextPageKey = result.next;
            } else {
                hasNextPage = false;
            }
        }

        return allRecords;
    }
    // test cases:
    // * next pages avaliable:
    //  lower size for testing and having ~12 records 
    // * no next pages avaliable:
    //   size > number of records
}


(async () => {
    kintone.events.on('app.record.index.show', async event => {
        console.log("Details show")
        console.log(event)
        console.log(event.appId)
        console.log(kintone.app.getQueryCondition())
    
        let cursor = new Cursor({ app: event.appId, query: kintone.app.getQueryCondition() })
        let response = await cursor.addCursor()
        console.log("Response from addCursor")
        console.log(response)

        // console.log("Response from allRecords")
        // let allRecords = await cursor.getAllRecords(response.id)
        // console.log(allRecords)

        console.log("Response from getCursor")
        console.log(await cursor.getCursor(response.id))

        // // ! Delete only works if you don't get the Cursor
        // console.log("Response from deleteCursor")
        // console.log(await cursor.deleteCursor(response.id))
        // // * Should return {} if deleted
        // // currently getting 404 error
    })
})()