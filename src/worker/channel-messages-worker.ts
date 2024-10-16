import {CronJob} from "cron"


//run only when the time is 12am up to 4am
//get one channel at a time and go through it each night
//store the first start message, and begin scanning backward with storing the pointer for the current message
//

let workerJob: CronJob;
const RIYADH_TIME_ZONE = "Asia/Riyadh"
export async function worker() {
    const startJob = new CronJob('0 0 * * *', async () => {
        workerJob = new CronJob('*/1 * * * *', async () => {
            console.log(`test worker ${Date.now()}`)
        }, null, true, RIYADH_TIME_ZONE)

    }, null, true, RIYADH_TIME_ZONE)


    new CronJob('0 4 * * *', async () => {
        if (workerJob) workerJob.stop();
        if (startJob) startJob.stop();

    }, null, true, RIYADH_TIME_ZONE)
}


// const generalChannels = channels.get("690871625054289932") as TextChannel
