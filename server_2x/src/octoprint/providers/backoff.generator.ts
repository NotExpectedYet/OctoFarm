interface EmptyFunction {
    (): Promise<any>
}

function wait(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration))
}

function backoffOrig(retries: number, callbackFn: EmptyFunction, delay = 500): Promise<any> {
    return callbackFn().catch((err) =>
        retries > 1 ?
            wait(delay).then(() => backoffOrig(retries - 1, callbackFn, delay * 2)) :
            Promise.reject(err)
    )
}

export async function backoff(retries: number, callbackFn: EmptyFunction, delay = 500): Promise<any> {
    let result: any;

    try {
        result = await callbackFn();
    } catch (e) {
        if (retries > 1) {
            await wait(delay);
            result = await backoff(retries - 1, callbackFn, delay * 2);
        } else {
            throw e;
        }
    }

    return result;
}

// let i: number
// function simulateNetworkFail(): Promise<any> {
//     return new Promise((resolve, reject) => {
//         console.log(`${i}/4`)
//         if (i === 4) {
//             return resolve('success')
//         }
//         i+=1
//         reject()
//     })
// }

// async function main() {
//     // Reset iterator
//     i = 1
//     console.log('orig implementation')
//     const returnValueOrigFn = await backoffOrig(10, simulateNetworkFail)
//     console.log(returnValueOrigFn)
//     // Prints:
//     // 1/4
//     // 2/4
//     // 3/4
//     // 4/4
//     // success
//
//     // Reset iterator
//     i = 1
//     console.log('new implementation')
//     const returnValueNewFn = await backoff(10, simulateNetworkFail)
//     console.log(returnValueNewFn)
//     // Prints:
//     // 1/4
//     // 2/4
//     // 3/4
//     // 4/4
//     // success
// }
//
// main()