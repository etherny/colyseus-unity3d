import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

class Position extends Schema {
  @type("float32")
  public x: number = 0;

  @type("float32")
  public y: number = 0;

  @type("float32")
  public z: number = 0;

  constructor(x: number, y: number, z: number) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Camp extends Schema {
  @type(Position)
  position: Position = new Position(0, 0, 0);
}

class Player extends Schema {
  @type(Camp)
  camp: Camp = new Camp();

  @type("boolean")
  connected: boolean = true;
}

class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();
}

export class DemoRoom extends Room {

  constructor () {
    super();

    this.setState(new State());
  }

  onInit (options: any) {
    console.log("DemoRoom created!", options);

    this.setPatchRate(1000 / 20);
    this.setSimulationInterval((dt) => this.update(dt));
  }

  requestJoin (options: any) {
    console.log("request join!", options);
    return true;
  }

  onJoin (client: Client, options: any) {
    console.log("client joined!", client.sessionId);
    this.state.players[client.sessionId] = new Player();
  }

  async onLeave (client: Client, consented: boolean) {
    this.state.players[client.sessionId].connected = false;

    try {
      if (consented) {
        throw new Error("consented leave!");
      }

      console.log("let's wait for reconnection!")
      const newClient = await this.allowReconnection(client, 10);
      console.log("reconnected!", newClient.sessionId);

    } catch (e) {
      console.log("disconnected!", client.sessionId);
      delete this.state.players[client.sessionId];
    }
  }

  onMessage (client: Client, data: any) {
    console.log(data, "received from", client.sessionId);

    if (data === "move_right") {
      (this.state.players[client.sessionId] as Player).camp.position.x += Math.random();
      (this.state.players[client.sessionId] as Player).camp.position.y += Math.random();
      (this.state.players[client.sessionId] as Player).camp.position.z += Math.random();
    }
    console.log("camp position: ", JSON.stringify((this.state.players[client.sessionId] as Player).camp.position));

    this.broadcast({ hello: "hello world" });
  }

  update (dt?: number) {
    // console.log("num clients:", Object.keys(this.clients).length);
  }

  onDispose () {
    console.log("disposing DemoRoom...");
  }

}