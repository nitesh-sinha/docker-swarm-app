# A sample nodeJS server app to play with docker in swarm mode. 

Docker's swarm mode introduces the following concepts in top down hierarchical order:

     Stack --> Service --> Task ---> Container

     * Stack - A stack is a group of one or more services.
     * Service - A logically separate component of the application(eg: web-service and database can be two different services which are part of the same stack).
     * Task - A logical unit of scheduling in a swarm. It corresponds to exactly one docker container. A manager node assigns a task to a worker node which has to execute it and either report a success or a failure. Tasks once assigned to a node cannot be moved to a different one.
     * Container - The actual docker container(as we know it). 
     

The following docker swarm commands(and their corresponding outputs) were used to deploy and inspect the deployed containers:
*It is worth pointing out that the swarm commands need to be executed either on the actual nodes which are part of the swarm or (if executing remotely)the remote client should point to a docker daemon running on one of the swarm nodes. In commands below, I'd used the latter approach, hence my local docker client on Macbook was pointing to the docker daemon on the swarm node(with manager role).This could be achieved by setting the following env vars on my Mac.*
```
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://192.168.99.100:2376"
export DOCKER_CERT_PATH="/Users/niteshsinha/.docker/machine/machines/myvm1"
export DOCKER_MACHINE_NAME="myvm1"
``` 
## Add a node(with role as manager) to the docker swarm. 
Note that this command has to be executed on the node which has to be become a "manager" node in the swarm.
```
Niteshs-MacBook-Pro:main niteshsinha$ docker swarm init
Swarm initialized: current node (ql4do9ex0gfcf9h3goqfxwexn) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-1v8jp58kux0uq54dv1btbj5g65adksqetnzj3hvo9l5jvr9yho-bx7f6y8fnrdfxikqhf1asriwj 192.168.65.3:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

## Add a node(with node as worker) to the existing docker swarm. 
Note that this command has to be executed on the node which needs to be the "worker" node in the swarm.
```
docker swarm join --token SWMTKN-1-1v8jp58kux0uq54dv1btbj5g65adksqetnzj3hvo9l5jvr9yho-bx7f6y8fnrdfxikqhf1asriwj 192.168.65.3:2377
```

## Deploying a stack in a docker swarm
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker stack deploy mynodeapp -c docker-compose.yml 
Ignoring unsupported options: build

Creating network mynodeapp_mynetwork
Creating service mynodeapp_myweb
```

## Verify that the stack was deployed
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker stack ls
NAME                SERVICES            ORCHESTRATOR
mynodeapp           1                   Swarm
```

## Verify the service(s) deployed as part of the stack deployment
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker stack services mynodeapp
ID                  NAME                MODE                REPLICAS            IMAGE                    PORTS
n20rm9jydl6f        mynodeapp_myweb     replicated          1/1                 niteshks/swarm-app:1.0   *:80->9999/tcp
```

## Verify the task level detail of the deployed service
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker stack ps mynodeapp
ID                  NAME                IMAGE                    NODE                    DESIRED STATE       CURRENT STATE           ERROR               PORTS
an6cbxbwx663        mynodeapp_myweb.1   niteshks/swarm-app:1.0   linuxkit-025000000001   Running             Running 3 minutes ago                       
```

## Scaling the service to a size of 4
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker service scale mynodeapp_myweb=4
mynodeapp_myweb scaled to 4
overall progress: 4 out of 4 tasks 
1/4: running   [==================================================>] 
2/4: running   [==================================================>] 
3/4: running   [==================================================>] 
4/4: running   [==================================================>] 
verify: Service converged 
```

## Verify that the service was infact scaled to a size of 4
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                    PORTS
n20rm9jydl6f        mynodeapp_myweb     replicated          4/4                 niteshks/swarm-app:1.0   *:80->9999/tcp
```

## Verify scaling at the task level
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker service ps mynodeapp_myweb
ID                  NAME                IMAGE                    NODE                    DESIRED STATE       CURRENT STATE                ERROR               PORTS
an6cbxbwx663        mynodeapp_myweb.1   niteshks/swarm-app:1.0   linuxkit-025000000001   Running             Running 11 minutes ago                           
jtlu61lseimv        mynodeapp_myweb.2   niteshks/swarm-app:1.0   linuxkit-025000000001   Running             Running about a minute ago                       
vd90fm2qyjyz        mynodeapp_myweb.3   niteshks/swarm-app:1.0   linuxkit-025000000001   Running             Running about a minute ago                       
hh5lvrfew62j        mynodeapp_myweb.4   niteshks/swarm-app:1.0   linuxkit-025000000001   Running             Running about a minute ago                       
```

## Bring down the node(by setting its availability in swarm) such that the tasks running on it is moved off of it by the mansger node
```
docker@myvm2:~$ docker node update --availability drain myvm2
myvm2
```
Note that if the manager node's availability is set ot "drain" and if that happens to be the only manager, then all tasks on it is still moved to other available nodes. This means that "drain" mode does not shut down manager service on the node. It only updates the manager's list of available nodes for task scheduling. 


## Set it back to active state so new tasks can be launched on it.
```
docker@myvm2:~$ docker node update --availability active myvm2
myvm2
```

## Remove the docker swarm stack
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker stack rm mynodeapp
Removing service mynodeapp_myweb
Removing network mynodeapp_mynetwork
```

## Remove the local node from the docker swarm
```
Niteshs-MacBook-Pro:docker-swarm-app niteshsinha$ docker swarm leave -f
Node left the swarm.
```
