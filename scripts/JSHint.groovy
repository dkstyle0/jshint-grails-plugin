import static groovy.io.FileType.FILES
import grails.util.GrailsUtil

includeTargets << grailsScript("_GrailsInit")

target('jshint': "Run JSHint") {
  depends(classpath)

  ant.copy(file: "${jshintPluginDir}/src/js/jshint-2.1.2.js",
         todir: "${basedir}/target/classes")
  def config = loadConfig('BuildConfig')
  println ("User Home: file:${userHome}/.grails/MyConfig.groovy")
  int maxPercentFailed = getConfigInt(config, 'maxPercentFailed', 100)

  println("Max Percent from Config: " + maxPercentFailed)

  def files = []

    def jshint = classLoader.loadClass('com.eclipsesource.jshint.JSHint')
    def jshint2 = jshint.getCopy()
    
    new File('./web-app').eachFileRecurse(FILES) {
      if(it.name.endsWith('.js')) {
        println it
        files << it.toString()
      }
    }
    println ("FILES: " + files.toArray())
     jshint2.main(files.toArray(new String[0]) )

    def failedPercent =  (jshint2.getFailedFiles() / jshint2.getNumFiles() ) * 100
    println ("FailedPercent: " + failedPercent )

    if (failedPercent > maxPercentFailed) {
      println "FAILED -- Too many files failed"
            System.exit(1)
    }
}

private ConfigObject loadConfig(String className) {
  def classLoader = Thread.currentThread().contextClassLoader
  classLoader.addURL(new File(classesDirPath).toURL())

    try {
        // Allow stubbing out in tests
        def parser = getBindingValueOrDefault('configParser', { name -> return new ConfigSlurper(GrailsUtil.environment).parse(classLoader.loadClass(className)) })
        println("Found parser")
        return parser(className).jshint
//        return new ConfigSlurper(GrailsUtil.environment).parse(classLoader.loadClass(className)).codenarc
    }
    catch(ClassNotFoundException e) {
      println("No parser")
        return new ConfigObject()
    }
}

private int getConfigInt(config, String name, int defaultIfMissing) {
  def value = config[name]
  return value instanceof Integer ? value : defaultIfMissing
}

private getBindingValueOrDefault(String varName, Object defaultValue) {
    def variables = getBinding().getVariables()
    return variables.containsKey(varName) ? getProperty(varName) : defaultValue
}

setDefaultTarget('jshint')
