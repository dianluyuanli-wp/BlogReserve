# 1、老的用法  
mobx是一个使用十分普遍的状态管理工具，在实际的开发过程中我们常常搭配react进行使用。在一些比较大的项目中，部分变量需要反复向下层组件进行传递，如果使用传统的组件props进行实现，层层包裹，未免过于繁琐，react官方针对这种场景，推出了context来进行上下文跨组件传递。而mobx也立足于react的context实现了inject语法，通过简洁的api，可以在任何想要使用全局状态的地方注入变量。为了方便进行全局的状态管理，往往设定一个全局的store,其中定义一些全局都会使用到的变量，进行状态控制，比较典型的例子如下：
```
import React from 'react';
import { inject, observer } from 'mobx-react';
import comA from 'comA ';
import comB from 'comB';

@inject('globalStore')
@observer
class Test extends React.Component{
    render() {
        const PanelContent = {
            'comA': comA,
            'comB': comB
        }
        const ShowContent = PanelContent[this.props.globalStore.funcType];
        return (
            <React.Fragment>
                <ShowContent />
            </React.Fragment>
        )
    }
}

export default Test ;
```
这里使用decorator装饰器语法，通过字符串的方式注入全局store，组件的this上将会添加属性globalStore,通过store中的funcType的变量来控制显示的组件，该变量变化时，渲染的组件也会根据条件变化（通过observer装饰器实现）。其外围容器的写法通常如下：
```
import React from 'react';
import { Provider, observer } from 'mobx-react';
import Test from 'Text';
import globalStorefrom './globalStore';

class parentCom extends React.Component {
    const Store = new globalStore({ funcType: 'comA'});
    return (
        <Provider globalStore={Store}>
          <Test />
        </Provider>
    )
};

export default parentCom;
```
其父组件通过mobx-react的provider包裹器来将全局的store作为参数传入。哪怕嵌套多层，子组件也可直接通过添加inject装饰器来使用全局store中的变量，就如Test。
# 2、hooks中的inject
react在最新的16.8中启用了hooks语法，力推函数式组件，尽管官方表示class式的组件在后续版本中并不会废弃，但是hooks是未来前端框架中组件的发展方向（最新的Vue也借鉴了react Hook的很多思路），我们需要大胆尝试新鲜事物。
到mobx官网上发现，几乎所有的例子都是基于class组件来写的，并没有发现跟react hook搭配使用的内容。。。最后在一个不起眼处，找到了一个链接，指向mobx-react的迁移文档。官方操作如下：
```
import { MobXProviderContext } from 'mobx-react'
function useStores() {
  return React.useContext(MobXProviderContext)
}
```
自己定义一个react hook,让后就可以在我们自己的组件中使用了：
```
function useUserData() {
  const { user, order } = useStores()
  return {
    username: user.name,
    orderId: order.id,
  }
}

const UserOrderInfo = observer(() => {
  // Do not destructure data!
  const data = useUserData()
  return (
    <div>
      {data.username} has order {data.orderId}
    </div>
  )
})
```
从官方例子中，我们可以发现可以弃用inject语法糖，直接通过自定义的useStores，我们就可以实现获取外层provider的变量并且使用，注意此处不能使用解构赋值，否则的话会导致无法实现变量的观测（即变量改变，页面显示没有同步），如果要实现观测：
```
// use mobx-react@6.1.2 or `mobx-react-lite`
import { useObserver } from 'mobx-react'
function useUserData() {
  const { user, order } = useStores()
  return useObserver(() => ({
    username: user.name,
    orderId: order.id,
  }))
}

const UserOrderInfo = () => {
  // this works now just fine
  const { username, orderId } = useUserData()
  return (
    <div>
      {username} has order {orderId}
    </div>
  )
}
```
如果你还是想要自己手动实现inject方法，那么官方还给了一个简单的inject组件实现：
```
import { MobXProviderContext } from 'mobx-react'
function inject(selector, baseComponent) {
  const component = ownProps => {
    const store = React.useContext(MobXProviderContext)
    return useObserver(() => baseComponent(selector({ store, ownProps })))
  }
  component.displayName = baseComponent.name
  return component
}
```
回到我们自己的组件，如果第一部分中的组件，要通过函数式组件的方式，使用provider提供的全局store要怎么办呢？
```
import React from 'react';
import { observer } from 'mobx-react';
import comA from 'comA';
import comB from 'comB';
import { useStores } from '@utils/index';

function useStores(name) {
    return React.useContext(MobXProviderContext)[name];
}

const Test = () => {
    const store = useStores('flagStore');  //  手动传入字符串，选择要使用的内容
        const PanelContent = {
            'comA': comA,
            'comB': comB
        }
    const ShowContent = PanelContent[store.funcType];
    return (
        <React.Fragment>
            <ShowContent />
        </React.Fragment>
    )
}

export default observer(Test );
```
官方例子中的useStores会返回所有在context中的内容，也就是所有上级provider中传递的内容，此处我们通过在自己的实现中传入一个字符串来控制选取我们需要的内容。
如有任何疑问，欢迎留言交流~  
————————————————————————————————————  
参考文献：
mobx-react迁移官方文档：  
https://mobx-react.js.org/recipes-migration  