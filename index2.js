const express = require('express');
const app = express();
const Queue = require('bull');
const Arena = require('bull-arena');
const queue = new Queue('example');


//app.get('/', (req, res) => res.send('Hello World!'));

/* queue.add({ x: 6, y: 6 }, {
  delay: 100,
  repeat: {
    cron: '* * * * * *'
  }
}).catch(err => console.log(err)); */

queue.add({ x: 6, y: 6 }).catch(err => console.log(err));
queue.on('completed', (job, result) => {
  console.log(`Job completed with result ${result}`);
})
queue.on('failed', (job, result) => {
  console.log(`Job completed with result ${result}`);
})

queue.process(async (job, resp) => {
  job.progress(100);
  console.log(`Processing job ${job.id}!!!!!!!!!!!${JSON.stringify(job)}`);
  //return job.data.x + job.data.y;
  return resp
});

app.use('/', Arena(
  {
    queues: [
      {
        name: 'example',
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

app.get('/queue/:x/:y', (req, res) => {
 /*  queue.createJob({ x: req.params.x, y: req.params.y }).save().then(job => {
    job.on('succeeded', (result) => {
      console.log(`Received result for job ${job.id}: ${result}`);
    });
    job.on('failed', (err) => {
      console.log(`Job ${job.id} failed with error ${err.message}`);
    });
  }); */
  queue.add({ x: req.params.x, y: req.params.y }, {
    delay: 100,
    repeat: {
      cron: '*/5 * * * * *'
    }
  }).catch(err => console.log(err));
  queue.on('completed', (job, result) => {
    console.log(`Job completed with result ${result}`);
  })
  queue.on('failed', (job, result) => {
    console.log(`Job completed with result ${result}`);
  })
  res.send('Post to Queue!')
}
);

app.get('/process', (req, res) => {
/*   queue.process(async (job) => {
    job.reportProgress(10);
    console.log(`Processing job ${job.id}!!!!!!!!!!!`);
    setTimeout(function() { 
      job.reportProgress(100)
    }, 2000);
    return job.data.x + job.data.y;
  }); */
  queue.process(async (job, data) => {
    job.progress(10);
    console.log(`Processing job ${job.id}!!!!!!!!!!! ${data}`);
    setTimeout(function() { 
      job.progress(100)
    }, 2000);
    return job.data.x + job.data.y;
  });
  res.send('Processed Queue!')
});

app.listen(4800, () => console.log('Example app listening on port 4800!'));