当前发现，在最外围使用Context.provider的时候，如果里面的值是个复杂结构，比如对象嵌套store，是没有办法实现更新的
```js
            <MobXProviderContext.Provider value={{ store, a: 1}}>
                <Menu onClick={this.navChange} mode='horizontal' defaultSelectedKeys={[this.state.currentTab]}>
                    <Menu.Item key={TAB.CONTENT}>json diff</Menu.Item>
                    <Menu.Item key={TAB.WORD}>单词diff</Menu.Item>
                    <Menu.Item key={TAB.LINES}>行内容diff</Menu.Item>
                </Menu>
                {this.getContent()}
                <Footer style={{ textAlign: 'center' }}>Produced by 广兰路地铁</Footer>
            </MobXProviderContext.Provider>

function xxx() {
    let a = useContext(MobXProviderContext);
    console.log(a);

    function test() {
        runInAction(() => {
            a.secret += 1;
        })
        console.log(a.secret, '2')
    }
    console.log('render');
    return <div>
        大家好
        <div>{a.secret}</div>
        <div onClick={test}>click</div>
    </div>
}

export default observer(xxx);
```

如果context的value不是observer过的class,还是没有办法触发更新的，因为context.provider的核心还是跨组件传递值。不使用provider，直接把store进行observer之后在处理也是可以进行更新的