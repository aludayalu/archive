import json, os

def parse(path):
    env={}
    try:
        lines=open(path).read().split("\n")
        for x in lines:
            x=x.strip()
            if "=" in x:
                splitted_x=x.split("=", 1)
                env[splitted_x[0]]=splitted_x[1]
    except:
        pass
    env=env | dict(os.environ)
    for x in env:
        try:
            env[x]=json.loads(env[x])
        except:
            pass
    return env