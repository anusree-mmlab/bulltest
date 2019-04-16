const express = require('express');
const cron = require("node-cron");
const app = express();
const Queue = require('bull');
const Arena = require('bull-arena');

const jobs = [
  {id: 1, name: 'job 1', status: 'active', fuel_status: 'weekly'},
  {id: 2, name: 'job 2', status: 'active', fuel_status: 'daily'},
  {id: 3, name: 'job 3', status: 'active', fuel_status: 'call_in'},
  {id: 4, name: 'job 4', status: 'active', fuel_status: 'daily'},
  {id: 5, name: 'job 5', status: 'active', fuel_status: 'quarterly'}
];

const orders = [];
const activeDailyJobs = jobs.filter(j => j.status === 'active' && j.fuel_status === 'daily' );
console.log(activeDailyJobs)


function jQueue() {
  const $Q = new Queue("Job_Dispatch");

  //Add jobs
  console.log("Adding jobs");
  activeDailyJobs.forEach(function(j, i) {
    $Q.add({ job_id: j.id, job_name: j.name });
  });
  console.log("done adding");

  //Process Jobs

  $Q.process(1, async job => {
    console.log("process", job.data);
    await wait(job);
    console.log("complete", orders);
  
    if(orders.length === activeDailyJobs.length){
      console.log('closing the queue');
      $Q.close();
    }
  }).catch(e => {
      /// <<-- is this requried??
      console.log("process function rejected ??!! ", e);
    })
    .then(() => {
      console.log("Done processing jobs");
    });
}


function processOrder(job) {
  orders.push({id: orders.length, job_id: job.job_id, job_name: job.job_name});
}

async function wait(job) {
  return new Promise(resolve => {
    processOrder(job.data);
    setTimeout(resolve, 1000)
  });
}

// First call
jQueue();

// schedule tasks to be run on the server   
//cron.schedule("0 1 * * *", function() { //Every 1 am
cron.schedule("* * * * *", function() {
  console.log("running a task every minute");
  jQueue();
});


app.use('/', Arena(
  {
    queues: [
      {
        name: 'Job_Dispatch',
        hostId: 'Worker',
        type: "bull",
        redis: {
          host: 'localhost',
          port: Number(6379),
          database: ('/0').substr(1) || '0',
          password: undefined
        }
      }
    ]
  },
  {
    basePath: '/',
    disableListen: true
  }
));


app.listen(4800, () => console.log('Example app listening on port 4800!'));