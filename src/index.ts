import NodePersist from 'node-persist';
import waitUntil from 'async-wait-until';
import Axios, { AxiosInstance } from 'axios';
import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
} from 'homebridge';

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('NatureRemoMultiToggleLight', NatureRemoMultiToggleLightAccessory);
};

class NatureRemoMultiToggleLightAccessory implements AccessoryPlugin {
  readonly #log: Logging;
  readonly #config: AccessoryConfig;
  readonly #api: API;

  readonly #natureRemoApi: AxiosInstance;
  readonly #lightbulbService: Service;
  readonly #instancePromise: Promise<void>;

  #transition = false;
  #signalId = '';
  #state: CharacteristicValue = false;
  #brightness: CharacteristicValue = 100;
  #colorTemperature: CharacteristicValue = 500;
  #hue: CharacteristicValue = 360;
  #saturation: CharacteristicValue = 100;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.#log = log;
    this.#config = config;
    this.#api = api;

    this.#natureRemoApi = Axios.create({
      baseURL: `${config.apiEndpoint.replace(/^(.+?)\/*?$/, '$1')}/1`, // Strip trailing slash then append /1
      headers: {Authorization: `Bearer ${config.accessToken}`},
    });

    this.#lightbulbService = new hap.Service.Lightbulb(config.name);
    this.#lightbulbService
      .getCharacteristic(hap.Characteristic.On)
      .onGet(this.getOnHandler.bind(this))
      .onSet(this.setOnHandler.bind(this));

    if (config.enableDummySettings) {
      this.#lightbulbService
        .getCharacteristic(hap.Characteristic.Brightness)
        .onGet(this.getBrightnessHandler.bind(this))
        .onSet(this.setBrightnessHandler.bind(this));
      this.#lightbulbService
        .getCharacteristic(hap.Characteristic.ColorTemperature)
        .onGet(this.getColorTemperatureHandler.bind(this))
        .onSet(this.setColorTemperatureHandler.bind(this));
      this.#lightbulbService
        .getCharacteristic(hap.Characteristic.Hue)
        .onGet(this.getHueHandler.bind(this))
        .onSet(this.setHueHandler.bind(this));
      this.#lightbulbService
        .getCharacteristic(hap.Characteristic.Saturation)
        .onGet(this.getSaturationHandler.bind(this))
        .onSet(this.setSaturationHandler.bind(this));
    }

    this.#instancePromise = this._initialize();
  }

  private async _initialize() {
    await NodePersist.init({dir: this.#api.user.persistPath(), forgiveParseErrors: true});
    const cachedState = await NodePersist.getItem(this.#config.name);
    if (cachedState !== undefined) {
      this.#state = cachedState;
    }

    interface Signal {
      name: string;
      id: string;
    }
    interface Appliance {
      nickname: string;
      signals: Array<Signal>;
    }

    try {
      const response = await this.#natureRemoApi.get('/appliances');
      const appliance = response.data.find(
        (appliance: Appliance) => appliance.nickname.trim() === this.#config.name.trim());
      if (appliance === undefined) {
        throw `Could not find appliance: ${this.#config.name}`;
      }
      const signal = appliance.signals.find(
        (signal: Signal) => signal.name.trim() === this.#config.buttonName.trim());
      if (signal === undefined) {
        throw `Could not find button: ${this.#config.buttonName}`;
      }
      this.#signalId = signal.id;
      this.#log.info(`${this.#config.name}'s signal id: ${signal.id}`);
    } catch (err) {
      this.#log.error('Error getting signal id: ', err);
    }
  }

  /**
   * @todo Keep retry if error
   */
  private async _requestToggle() {
    await this.#instancePromise;

    return this.#natureRemoApi.post(`/signals/${this.#signalId}/send`)
      .catch((err: Error) => this.#log.error('Error sending toggle signal: ', err));
  }

  /**
   * Call "callable" n times
   * @param n Number of time to call callable
   * @param callable Callable to be called.
   * @returns Promise<void>
   */
  private async _repeat(n: number, callable: () => Promise<unknown>): Promise<void> {
    await this.#instancePromise;
    if (n < 0) {
      return;
    }

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    await callable();
    for (let i = 0; i < n - 1; i++) {
      await sleep(this.#config.signalDelay);
      await callable();
    }
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.#lightbulbService,
    ];
  }

  async getOnHandler(): Promise<CharacteristicValue> {
    await this.#instancePromise;
    this.#log.info(`Getting ${this.#config.name} state`);
    await waitUntil(() => !this.#transition);
    return this.#state;
  }

  async setOnHandler(value: CharacteristicValue): Promise<void> {
    await this.#instancePromise;
    this.#log.info(`Setting ${this.#config.name} state to: ${value}`);

    await waitUntil(() => !this.#transition);

    // Already correct state, do nothing
    if (this.#state === value) {
      return;
    }

    this.#transition = true;
    const toggleCount: number = this.#state ? this.#config.offToggleCount : this.#config.onToggleCount;
    const toggleClosure = async () => await this._requestToggle();
    await this._repeat(toggleCount, toggleClosure);
    this.#state = value;
    await NodePersist.setItem(this.#config.name, value);
    this.#transition = false;
  }

  async getBrightnessHandler(): Promise<CharacteristicValue> {
    await this.#instancePromise;
    this.#log.info(`Getting ${this.#config.name} state`);
    await waitUntil(() => !this.#transition);
    return this.#brightness;
  }

  async setBrightnessHandler(value: CharacteristicValue): Promise<void> {
    await this.#instancePromise;
    this.#log.info(`Setting ${this.#config.name} brightness to: ${value}`);
    await waitUntil(() => !this.#transition);
    this.#brightness = value;
  }

  async getColorTemperatureHandler(): Promise<CharacteristicValue> {
    await this.#instancePromise;
    this.#log.info(`Getting ${this.#config.name} color temperature`);
    await waitUntil(() => !this.#transition);
    return this.#colorTemperature;
  }

  async setColorTemperatureHandler(value: CharacteristicValue): Promise<void> {
    await this.#instancePromise;
    this.#log.info(`Setting ${this.#config.name} color temperature to: ${value}`);
    await waitUntil(() => !this.#transition);
    this.#colorTemperature = value;
  }

  async getHueHandler(): Promise<CharacteristicValue> {
    await this.#instancePromise;
    this.#log.info(`Getting ${this.#config.name} hue`);
    await waitUntil(() => !this.#transition);
    return this.#hue;
  }

  async setHueHandler(value: CharacteristicValue): Promise<void> {
    await this.#instancePromise;
    this.#log.info(`Setting ${this.#config.name} hue to: ${value}`);
    await waitUntil(() => !this.#transition);
    this.#hue = value;
  }

  async getSaturationHandler(): Promise<CharacteristicValue> {
    await this.#instancePromise;
    this.#log.info(`Getting ${this.#config.name} saturation`);
    await waitUntil(() => !this.#transition);
    return this.#saturation;
  }

  async setSaturationHandler(value: CharacteristicValue): Promise<void> {
    await this.#instancePromise;
    this.#log.info(`Setting ${this.#config.name} saturation to: ${value}`);
    await waitUntil(() => !this.#transition);
    this.#saturation = value;
  }

}
