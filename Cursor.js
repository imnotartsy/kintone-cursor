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

// const cursor = new Cursor({ app, [ subDomain ], [ token ], [ query ] })

class Cursor {
    #app = null // # --> private vars; can set default vars
    #subDomain = null
    #token = null
    #query = null

    #url = null
    
    constructor({app, subDomain=null, token=null, query=null} = {} = {}) {
        if (!app) console.warn("Missing app for cursor") // send parameters as object so you can null out parameters
        this.#app = app
        this.#subDomain = subDomain
        this.#token = token
        this.#query = query


        // true case: for on the server (outside kintone) | else for on the client (inside kintone)
        this.#url = subDomain ?
            createKintoneUrl(subDomain, "/k/v1/records/cursor") :
            kintone.api.url('/k/v1/records/cursor', true)
    }

    
    addCursor() {
        // fetch only if there's a token, else, use internal perms
        let body = {
            "app": this.#app,
            "query": this.#query,
            "size": 500
        }

        if (this.#token) {
            fetch(this.#url, {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest", // * might need to remove this
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

        } else {
            kintone.api(kintone.api.url('/k/v1/records/cursor', true), 'POST', body, resolve, reject);
        }       
    }
    
    getCursor() {

    }

    deleteCursor() {
    }
}


(() => {
    kintone.events.on('app.record.index.show', event => {
        console.log("Details show")
        console.log(event)
        console.log(event.appId)
        // console.log(kintone.app.getId())
        console.log(kintone.app.getQueryCondition())
           
    })
    
    // let cursor = new Cursor({ app: , subDomain: "dev" })
    // cursor.addCursor()
})()