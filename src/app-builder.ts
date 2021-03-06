import { Simple } from '@glimmer/runtime';
import Resolver, { BasicModuleRegistry, ResolverConfiguration } from '@glimmer/resolver';
import defaultResolverConfiguration from './default-resolver-configuration';
import { precompile } from './compiler';

export interface AppBuilderOptions {
  ApplicationClass?: any;
  ComponentManager?: any;
  resolverConfiguration?: ResolverConfiguration;
  document?: Simple.Document;
}

export interface ComponentFactory {
  create(injections: object): any;
}

export class AppBuilder {
  rootName: string;
  modules: any = {};
  options: AppBuilderOptions;

  constructor(name: string, options: AppBuilderOptions) {
    this.rootName = name;
    this.options = options;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = this.options.ComponentManager;
    this.template('main', '<div />');
  }

  template(name: string, template: string) {
    let specifier = `template:/${this.rootName}/components/${name}`;
    this.modules[specifier] = precompile(template, { meta: { specifier, '<template-meta>': true }});
    return this;
  }

  component(name: string, componentFactory: ComponentFactory) {
    let specifier = `component:/${this.rootName}/components/${name}`;
    this.modules[specifier] = componentFactory;
    return this;
  }

  helper(name: string, helperFunc: Function) {
    let specifier = `helper:/${this.rootName}/components/${name}`;
    this.modules[specifier] = helperFunc;
    return this;
  }

  boot() {
    let resolverConfiguration = this.options.resolverConfiguration || defaultResolverConfiguration;
    resolverConfiguration.app = resolverConfiguration.app || { 
      name: this.rootName, 
      rootName: this.rootName 
    };

    let registry = new BasicModuleRegistry(this.modules);
    let resolver = new Resolver(resolverConfiguration, registry);

    let app = new this.options.ApplicationClass({
      rootName: this.rootName,
      resolver,
      document: this.options.document
    });

    // TODO - after @glimmer/application > 0.4.0 is published, we can change
    // the following to simply: 
    // ```
    // let rootElement = app.document.createElement('div');
    // ```
    //
    // Because `app.document` will always be assigned.
    let document = app.document || this.options.document || window.document;
    let rootElement = document.createElement('div');

    app.rootElement = rootElement;
    app.renderComponent('main', rootElement, null);

    app.boot();

    return app;
  }
}
 